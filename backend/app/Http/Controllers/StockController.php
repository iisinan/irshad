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
     * Fetch recent compliance changes for the dashboard feed.
     */
    public function complianceChanges(): JsonResponse
    {
        $changes = \App\Models\ComplianceHistory::with('company:id,symbol,name')
            ->orderBy('changed_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($change) {
                return [
                    'id' => $change->id,
                    'symbol' => $change->company->symbol,
                    'name' => $change->company->name,
                    'old_status' => $change->old_status,
                    'new_status' => $change->new_status,
                    'reason' => $change->reason,
                    'changed_at' => $change->changed_at,
                    'time_ago' => $change->changed_at->diffForHumans(),
                ];
            });

        return $this->success($changes);
    }

    /**
     * Fetch stock details by symbol.
     */
    public function show(string $symbol): JsonResponse
    {
        $stock = \Illuminate\Support\Facades\Cache::remember("stocks.show.{$symbol}_v2", 300, function () use ($symbol) {
            $company = Company::with(['status', 'financials' => fn($q) => $q->latest(), 'dailyPrices' => fn($q) => $q->latest('date'), 'news'])->where('symbol', $symbol)->firstOrFail();
            
            // Map the FinancialScreening into financials for legacy mobile app compatibility
            $existingScreening = \App\Models\FinancialScreening::where('company_ticker', $symbol)
                ->orderBy('created_at', 'desc')
                ->first();
                
            if ($existingScreening) {
                $calc = $existingScreening->calculation_results ?? [];
                $ratios = $calc['ratios'] ?? [];
                
                $simulatedFinancial = [
                    'overall_financial_pass' => $calc['overall_financial_pass'] ?? true,
                    'interest_income_ratio' => $ratios['non_permissible_income_ratio'] ?? 0,
                    'interest_bearing_debt_ratio' => $ratios['interest_bearing_debt_ratio'] ?? 0,
                    'cash_and_equivalents_ratio' => $ratios['cash_and_equivalents_ratio'] ?? 0,
                    'non_compliant_income_ratio' => $ratios['non_permissible_income_ratio'] ?? 0,
                    'evidence_link' => $existingScreening->evidence_links,
                ];
                
                if ($company->financials && $company->financials->count() > 0) {
                    $fin = $company->financials->first();
                    foreach($simulatedFinancial as $key => $val) {
                        $fin->$key = $val;
                    }
                } else {
                    $company->setRelation('financials', collect([new \App\Models\Financial($simulatedFinancial)]));
                }
            }
            return $company;
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

        // Clear all caches so the new status reflects immediately everywhere
        \Illuminate\Support\Facades\Cache::forget('stocks.index');
        \Illuminate\Support\Facades\Cache::forget('stocks.index_v6');
        \Illuminate\Support\Facades\Cache::forget('stocks.ngx');
        \Illuminate\Support\Facades\Cache::forget('stocks.ngx_v3');
        \Illuminate\Support\Facades\Cache::forget("stocks.show.{$symbol}");
        \Illuminate\Support\Facades\Cache::forget("stocks.show.{$symbol}_v2");
        \Illuminate\Support\Facades\Cache::forget("aaoifi_stage1_{$symbol}"); // Bust analysis page cache

        return $this->success($company->load('status'), 'Stock status updated successfully by scholar.');
    }

    /**
     * Admin override for stock AAOIFI financial data.
     */
    public function updateAaoifi(Request $request, string $symbol): JsonResponse
    {
        $request->validate([
            'total_debt' => 'required|numeric',
            'cash' => 'required|numeric',
            'interest_income' => 'required|numeric',
            'evidence_links' => 'nullable|array',
            'evidence_links.*' => 'url'
        ]);

        $company = Company::where('symbol', $symbol)->firstOrFail();
        
        $screening = \App\Models\FinancialScreening::where('company_ticker', $symbol)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$screening) {
            return $this->error('No existing screening found to override. Please run a screening first.', 404);
        }

        $chosen = $screening->chosen_values ?? [];
        $chosen['total_debt'] = ['value' => $request->total_debt, 'source' => 'Manual Admin Override'];
        $chosen['cash_and_equivalents'] = ['value' => $request->cash, 'source' => 'Manual Admin Override'];
        $chosen['interest_income'] = ['value' => $request->interest_income, 'source' => 'Manual Admin Override'];
        // Default some optional values if provided, else keep existing
        if ($request->has('total_assets')) {
            $chosen['total_assets'] = ['value' => $request->total_assets, 'source' => 'Manual Admin Override'];
        }
        if ($request->has('total_revenue')) {
            $chosen['total_revenue'] = ['value' => $request->total_revenue, 'source' => 'Manual Admin Override'];
        }

        $screening->chosen_values = $chosen;

        // Recalculate Ratios
        $calc = $screening->calculation_results ?? [];
        $ratios = $calc['ratios'] ?? [];
        $status = $calc['status'] ?? [];

        $marketCap = $company->market_cap > 0 ? $company->market_cap : 1;
        $revenue = ($chosen['total_revenue']['value'] ?? 0) > 0 ? $chosen['total_revenue']['value'] : $marketCap;

        $ratios['interest_bearing_debt_ratio'] = ($request->total_debt / $marketCap);
        $ratios['cash_and_equivalents_ratio'] = ($request->cash / $marketCap);
        $ratios['non_permissible_income_ratio'] = ($request->interest_income / $revenue);

        $status['debt_pass'] = $ratios['interest_bearing_debt_ratio'] < 0.30;
        $status['cash_pass'] = $ratios['cash_and_equivalents_ratio'] < 0.30;
        $status['income_pass'] = $ratios['non_permissible_income_ratio'] < 0.05;

        $calc['ratios'] = $ratios;
        $calc['status'] = $status;
        $calc['overall_financial_pass'] = $status['debt_pass'] && $status['cash_pass'] && $status['income_pass'];

        $screening->calculation_results = $calc;
        $screening->is_manual_override = true;
        if ($request->has('evidence_links')) {
            $screening->evidence_links = $request->evidence_links;
        }
        $screening->save();

        // Also update the financials table so normal checks see it
        $financial = \App\Models\Financial::where('company_id', $company->id)->latest()->first();
        if ($financial) {
            $financial->update([
                'total_debt' => $request->total_debt,
                'cash_and_equivalents' => $request->cash,
                'interest_income' => $request->interest_income,
            ]);
        }

        // Trigger compliance re-eval (which updates the stock status on the dashboard)
        if ($financial) {
            $this->complianceService->evaluateCompliance($company, $financial, $company->sector);
        }

        \Illuminate\Support\Facades\Cache::forget('stocks.index');
        \Illuminate\Support\Facades\Cache::forget('stocks.ngx');
        \Illuminate\Support\Facades\Cache::forget("stocks.show.{$symbol}");

        return $this->success($screening, 'Financial data updated manually.');
    }

    /**
     * Ask Perplexity AI for a Shariah analysis of the stock with confidence score and sources.
     */
    public function getAiAnalysis(string $symbol, \App\Services\PerplexityAiService $aiService): JsonResponse
    {
        $company = Company::with(['status', 'financials' => fn($q) => $q->latest()])->where('symbol', $symbol)->firstOrFail();
        
        $statusStr = $company->status ? $company->status->status : 'unknown';
        $financials = $company->financials->first();

        $result = $aiService->analyzeCompliance($company, $financials, $statusStr);

        return $this->success([
            'reasoning' => $result['reasoning'],
            'confidence_score' => $result['confidence_score'],
            'sources' => $result['sources'],
            'analysis' => $result['reasoning']
        ]);
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
            
            $financial = $company->financials()->latest()->first();

            // Map the Python Engine output to the legacy frontend format
            // Fallback to database financials if Python AI extraction failed (returned 0 or empty)
            $totalAssets = !empty($chosen['total_assets']['value']) ? $chosen['total_assets']['value'] : ($financial->total_assets ?? 0);
            $totalDebt = !empty($chosen['total_debt']['value']) ? $chosen['total_debt']['value'] : ($financial->total_debt ?? 0);
            $cash = !empty($chosen['cash_and_equivalents']['value']) ? $chosen['cash_and_equivalents']['value'] : ($financial->cash_and_equivalents ?? 0);
            $interestIncome = !empty($chosen['interest_income']['value']) ? $chosen['interest_income']['value'] : ($financial->interest_income ?? 0);
            $totalRevenue = !empty($chosen['total_revenue']['value']) ? $chosen['total_revenue']['value'] : ($financial->total_revenue ?? 0);
            $marketCap = ($calc['denominator_used'] ?? null) === 'Market Capitalization' && !empty($calc['denominator_value']) ? $calc['denominator_value'] : $company->market_cap;
            
            $impureRatio = $ratios['non_permissible_income_ratio'] ?? null;
            if ($impureRatio === null && $totalRevenue > 0) {
                $impureRatio = ($interestIncome / $totalRevenue) * 100;
            } else if ($impureRatio !== null) {
                $impureRatio = $impureRatio * 100;
            }

            $debtRatio = isset($ratios['interest_bearing_debt_ratio']) ? $ratios['interest_bearing_debt_ratio'] * 100 : null;
            if ($debtRatio === null && $marketCap > 0) {
                $debtRatio = ($totalDebt / $marketCap) * 100;
            }
            
            $cashRatio = isset($ratios['cash_and_equivalents_ratio']) ? $ratios['cash_and_equivalents_ratio'] * 100 : null;
            if ($cashRatio === null && $marketCap > 0) {
                $cashRatio = ($cash / $marketCap) * 100;
            }

            // Run Stage 1 (Qualitative) using Perplexity AI (Cached for 7 days)
            $stage1 = cache()->remember("aaoifi_stage1_{$company->symbol}", now()->addDays(7), function () use ($company) {
                $perplexity = new \App\Services\PerplexityAiService();
                return $perplexity->runBusinessActivityScreening($company);
            });

            $stage1Pass = ($stage1['compliance_status'] ?? 'PASS') === 'PASS';
            
            // Recalculate Stage 2 Pass dynamically instead of trusting the AI script, 
            // since the AI script frequently fails due to missing denominators.
            $debtPass = $debtRatio !== null ? ($debtRatio <= 30) : true;
            $cashPass = $cashRatio !== null ? ($cashRatio <= 30) : true;
            $impurePass = $impureRatio !== null ? ($impureRatio <= 5) : true;
            
            $stage2Pass = $debtPass && $cashPass && $impurePass;
            
            // FINAL STATUS — always use the DB as ground truth (kept accurate by irshad:sync-status).
            // Only fall back to live computation if no DB record exists yet for this stock.
            // This ensures the analysis page verdict always matches the listing page verdict.
            $dbStatus = $company->status ? $company->status->status : null;
            $isScholarVerified = $company->status && $company->status->verified_by_scholar;
            $computedStatus = ($stage1Pass && $stage2Pass) ? 'halal' : 'non-halal';
            $finalStatus = $dbStatus ?? $computedStatus;
            
            $statusReason = null;
            if ($isScholarVerified) {
                $statusReason = $company->status->reason;
            } else {
                if ($finalStatus === 'halal') {
                    $statusReason = 'Passes both qualitative business and quantitative financial Shariah compliance checks.';
                } else {
                    $statusReason = 'Fails Shariah compliance based on current financial disclosures or business activities.';
                }
            }
            $aaoifiDB = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();
            $dbSource = $aaoifiDB && isset($aaoifiDB->financial_data_used['source']) 
                ? $aaoifiDB->financial_data_used['source'] 
                : "Data aggregated from Nigerian Exchange Group (NGX), AfricanFinancials, and Yahoo Finance.";

            $sourceLinks = [
                [
                    'name' => 'Yahoo Finance',
                    'description' => 'Market Cap, Cash & Debt metrics',
                    'url' => 'https://finance.yahoo.com/quote/' . $company->symbol . '.LG/financials'
                ],
                [
                    'name' => 'AfricanFinancials',
                    'description' => 'Secondary financial data and overview',
                    'url' => 'https://africanfinancials.com/company/ng-' . strtolower($company->symbol) . '/'
                ],
                [
                    'name' => 'Nigerian Exchange Group (NGX)',
                    'description' => 'Official corporate filings and pricing',
                    'url' => 'https://ngxgroup.com/exchange/data/company-profile/?symbol=' . $company->symbol
                ]
            ];

            $mapped = [
                'company_id' => $company->id,
                'stage1' => [
                    'status' => $stage1Pass ? 'halal' : 'non-halal',
                    'haram_revenue_percent' => $stage1['haram_revenue_percent'] ?? 0,
                    'purification_required' => $stage1['purification_required'] ?? false,
                    'reason' => $stage1['reason'] ?? '',
                ],
                'business_status' => $stage1Pass ? 'pass' : 'fail',
                'business_reasoning' => $stage1['reason'] ?? $company->activity_reason,
                'debt_ratio' => $debtRatio,
                'debt_status' => $debtPass ? 'pass' : 'fail',
                'cash_ratio' => $cashRatio,
                'cash_status' => $cashPass ? 'pass' : 'fail',
                'impermissible_income_ratio' => $impureRatio,
                'impermissible_income_status' => $impurePass ? 'pass' : 'fail',
                'illiquid_ratio' => null, // Python engine currently doesn't compute this
                'illiquid_status' => 'pass',
                'receivables_ratio' => null, // Python engine currently doesn't compute this
                'receivables_status' => 'pass',
                'final_status' => $finalStatus,
                'news_sources' => $busScreening ? $busScreening->supporting_evidence : [],
                'financial_data_used' => [
                    'market_cap' => $marketCap,
                    'total_assets' => $totalAssets,
                    'total_debt' => $totalDebt,
                    'cash' => $cash,
                    'interest_bearing_securities' => 0,
                    'accounts_receivable' => 0,
                    'illiquid_assets' => 0,
                    'interest_income' => $interestIncome,
                    'total_revenue' => $totalRevenue,
                    'source' => $dbSource,
                    'source_links' => $sourceLinks,
                ],
                'ai_explanation' => !empty($existingScreening->ai_explanation) ? $existingScreening->ai_explanation : $company->activity_reason,
                'status_reason' => $statusReason,
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
