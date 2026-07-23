<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\StockStatus;
use App\Services\AaoifiComplianceService;
use App\Services\NgxService;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends Controller
{
    use ApiResponder;

    protected NgxService $ngxService;
    protected AaoifiComplianceService $complianceService;

    public function __construct(NgxService $ngxService, AaoifiComplianceService $complianceService)
    {
        $this->ngxService = $ngxService;
        $this->complianceService = $complianceService;
    }

    public function index(): JsonResponse
    {
        $stocks = \Illuminate\Support\Facades\Cache::remember('stocks.index_v6', 300, function () {
            return Company::select(['id', 'name', 'symbol', 'sector', 'current_status', 'latest_price', 'price_change_pct', 'logo_url', 'market_cap', 'pe_ratio'])
                ->whereNotNull('latest_price')
                ->where('latest_price', '>', 0)
                ->get()
                ->map(function ($company) {
                    $company->status = $company->current_status ? ['status' => $company->current_status] : null;
                    return $company;
                });
        });
        
        return $this->success($stocks);
    }

    /**
     * Fetch stock details by symbol.
     */
    public function show(string $symbol): JsonResponse
    {
        $stock = \Illuminate\Support\Facades\Cache::remember("stocks.show.{$symbol}", 300, function () use ($symbol) {
            return Company::with(['status', 'financials' => fn($q) => $q->latest(), 'dailyPrices' => fn($q) => $q->latest('date')])->where('symbol', $symbol)->firstOrFail();
        });

        return $this->success($stock);
    }

    public function search(Request $request): JsonResponse
    {
        $query = substr(trim($request->get('q', '')), 0, 100);

        $stocks = Company::select(['id', 'name', 'symbol', 'sector', 'current_status', 'latest_price', 'price_change_pct', 'logo_url'])
            ->whereNotNull('latest_price')
            ->where('latest_price', '>', 0)
            ->where(function($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('symbol', 'LIKE', "%{$query}%");
            })
            ->limit(20)
            ->get()->map(function ($company) {
                $company->status = $company->current_status ? ['status' => $company->current_status] : null;
                return $company;
            });

        return $this->success($stocks);
    }

    public function ngx(Request $request): JsonResponse
    {
        $cacheKey = 'stocks.ngx_v6_' . md5(json_encode($request->all()));
        
        $stocks = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($request) {
            $query = Company::select([
                'id', 'name', 'symbol', 'sector', 'current_status', 
                'latest_price', 'price_change', 'price_change_pct', 
                'market_cap', 'pe_ratio', 'eps', 'logo_url'
            ])->whereNotNull('latest_price')->where('latest_price', '>', 0);

            if ($request->has('status') && !empty($request->status)) {
                $statusFilters = explode(',', strtolower($request->status));
                $query->whereIn('current_status', $statusFilters);
            }

            if ($request->has('sector') && !empty($request->sector)) {
                $sectorFilters = explode(',', strtolower($request->sector));
                $query->whereIn('sector', $sectorFilters);
            }

            if ($request->has('min_market_cap')) {
                $query->where('market_cap', '>=', (float) $request->min_market_cap);
            }

            if ($request->has('pe_max')) {
                $query->whereNotNull('pe_ratio')->where('pe_ratio', '<=', (float) $request->pe_max);
            }

            $perPage = $request->input('per_page');
            
            if ($perPage) {
                return $query->paginate((int)$perPage)->through(function ($company) {
                    $company->status = $company->current_status ? ['status' => $company->current_status] : null;
                    return $company;
                });
            } else {
                return $query->get()->map(function ($company) {
                    $company->status = $company->current_status ? ['status' => $company->current_status] : null;
                    return $company;
                });
            }
        });

        return $this->success($stocks);
    }

    /**
     * Run the 3-stage AAOIFI screening for a given stock using real DB data.
     * Uses AaoifiComplianceService (the authoritative engine).
     */
    public function check(string $symbol): JsonResponse
    {
        $company = Company::with(['financials' => fn($q) => $q->latest()])->where('symbol', $symbol)->firstOrFail();

        $financials = $company->financials->first();

        if (!$financials) {
            return $this->error('No financial data available for this stock. Please wait for the next scheduled scrape.', 404);
        }

        // Use the authoritative 3-stage compliance engine
        $status = $this->complianceService->evaluateCompliance($company, $financials, $company->sector);

        // Clear relevant caches since status might have changed
        \Illuminate\Support\Facades\Cache::forget('stocks.index');
        \Illuminate\Support\Facades\Cache::forget('stocks.ngx');
        \Illuminate\Support\Facades\Cache::forget("stocks.show.{$symbol}");

        return $this->success($company->load(['status', 'financials', 'dailyPrices' => fn($q) => $q->latest('date')->limit(1)]), 'Screening completed.');
    }

    /**
     * Scholar/Admin override for stock compliance status.
     * Requires admin or scholar role.
     */
    public function updateStatus(Request $request, string $symbol): JsonResponse
    {
        // Role check — only scholars and admins may override
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['scholar', 'admin'])) {
            return $this->error('Forbidden. Only scholars and admins may override compliance status.', 403);
        }

        $request->validate([
            'status' => 'required|in:halal,non-halal,doubtful',
            'reason' => 'required|string|max:500',
        ]);

        $company = Company::where('symbol', $symbol)->firstOrFail();
        $oldStatus = $company->status ? $company->status->status : null;

        $status = $company->status()->updateOrCreate(
            ['company_id' => $company->id],
            [
                'status'             => $request->status,
                'reason'             => 'Scholar Override: ' . $request->reason,
                'verified_by_scholar' => true,
                'last_updated'       => now(),
            ]
        );

        // Audit log
        \App\Models\AuditLog::create([
            'user_id' => $user->id,
            'action' => 'override_stock_status',
            'target_type' => Company::class,
            'target_id' => $company->id,
            'changes' => [
                'old_status' => $oldStatus,
                'new_status' => $request->status,
                'reason' => $request->reason
            ]
        ]);

        event(new \App\Events\StockStatusChanged($company, $status));

        // Clear caches so the new status reflects immediately
        \Illuminate\Support\Facades\Cache::forget('stocks.index');
        \Illuminate\Support\Facades\Cache::forget('stocks.ngx');
        \Illuminate\Support\Facades\Cache::forget('stocks.ngx_v3');
        \Illuminate\Support\Facades\Cache::forget("stocks.show.{$symbol}");

        return $this->success($company->load('status'), 'Stock status updated successfully by scholar.');
    }

    /**
     * Ask Gemini AI for a plain-English explanation of the stock's compliance status.
     */
    public function getAiAnalysis(string $symbol, \App\Services\GeminiAiService $aiService): JsonResponse
    {
        $company = Company::with(['status', 'financials' => fn($q) => $q->latest()])->where('symbol', $symbol)->firstOrFail();
        
        $statusStr = $company->status ? $company->status->status : 'unknown';
        $financials = $company->financials->first();

        $analysis = $aiService->analyzeCompliance($company, $financials, $statusStr);

        return $this->success(['analysis' => $analysis]);
    }

    /**
     * Execute or retrieve the AAOIFI detailed screening for a stock.
     */
    public function aaoifiScreening(string $symbol): JsonResponse
    {
        $company = Company::where('symbol', $symbol)->firstOrFail();
        
        // 1. Check if we have a fresh FinancialScreening from the new AI Engine
        $existingScreening = \App\Models\FinancialScreening::where('company_ticker', $symbol)
            ->where('created_at', '>=', now()->subDays(7))
            ->orderBy('created_at', 'desc')
            ->first();
            
        if ($existingScreening) {
            $busScreening = \App\Models\BusinessScreening::where('ticker', $symbol)->orderBy('created_at', 'desc')->first();
            
            $calc = $existingScreening->calculation_results ?? [];
            $ratios = $calc['ratios'] ?? [];
            $status = $calc['status'] ?? [];
            $chosen = $existingScreening->chosen_values ?? [];
            
            // Map the Python Engine output to the legacy frontend format
            $mapped = [
                'company_id' => $company->id,
                'business_status' => $busScreening && $busScreening->business_compliance_status === 'Non-Compliant' ? 'fail' : 'pass',
                'business_reasoning' => $busScreening ? $busScreening->ai_explanation : null,
                'debt_ratio' => $ratios['interest_bearing_debt_ratio'] ?? null,
                'debt_status' => ($status['debt_pass'] ?? true) ? 'pass' : 'fail',
                'cash_ratio' => $ratios['cash_and_equivalents_ratio'] ?? null,
                'cash_status' => ($status['cash_pass'] ?? true) ? 'pass' : 'fail',
                'impermissible_income_ratio' => $ratios['non_permissible_income_ratio'] ?? null,
                'impermissible_income_status' => ($status['income_pass'] ?? true) ? 'pass' : 'fail',
                'illiquid_ratio' => null, // Python engine currently doesn't compute this
                'illiquid_status' => 'pass',
                'receivables_ratio' => null, // Python engine currently doesn't compute this
                'receivables_status' => 'pass',
                'final_status' => ($calc['overall_financial_pass'] ?? true) && ($busScreening ? $busScreening->business_compliance_status !== 'Non-Compliant' : true) ? 'halal' : 'non-halal',
                'news_sources' => $busScreening ? $busScreening->supporting_evidence : [],
                'financial_data_used' => [
                    'market_cap' => $company->market_cap,
                    'total_assets' => $chosen['total_assets'] ?? 0,
                    'total_debt' => $chosen['total_debt'] ?? 0,
                    'cash' => $chosen['cash_and_equivalents'] ?? 0,
                    'interest_bearing_securities' => 0,
                    'accounts_receivable' => 0,
                    'illiquid_assets' => 0,
                    'interest_income' => $chosen['interest_income'] ?? 0,
                    'total_revenue' => $chosen['total_revenue'] ?? 0,
                ],
                'ai_explanation' => $existingScreening->ai_explanation,
            ];
            
            return $this->success($mapped);
        }
        
        // 2. If no fresh data exists, trigger the background job
        \App\Jobs\ProcessCompanyScreening::dispatch($symbol);
        
        // 3. Return 202 Accepted so the frontend knows to poll
        return response()->json([
            'status' => 'processing',
            'message' => 'Screening is currently running in the background. Please check back in a few minutes.'
        ], 202);
    }
}
