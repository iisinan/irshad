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

    /**
     * List all stocks with latest price and compliance status.
     */
    public function index(): JsonResponse
    {
        $stocks = \Illuminate\Support\Facades\Cache::rememberForever('stocks.index', function () {
            return Company::with(['status', 'dailyPrices' => fn($q) => $q->latest('date')->limit(1)])->get();
        });
        
        return $this->success($stocks);
    }

    /**
     * Fetch stock details by symbol.
     */
    public function show(string $symbol): JsonResponse
    {
        $stock = \Illuminate\Support\Facades\Cache::rememberForever("stocks.show.{$symbol}", function () use ($symbol) {
            return Company::with(['status', 'financials' => fn($q) => $q->latest(), 'dailyPrices' => fn($q) => $q->latest('date')->limit(30)])->where('symbol', $symbol)->firstOrFail();
        });

        return $this->success($stock);
    }

    /**
     * Search stocks by name or symbol.
     */
    public function search(Request $request): JsonResponse
    {
        $query = substr(trim($request->get('q', '')), 0, 100); // Sanitize query length

        $stocks = Company::with(['status', 'dailyPrices' => fn($q) => $q->latest('date')->limit(1)])
            ->where('name', 'LIKE', "%{$query}%")
            ->orWhere('symbol', 'LIKE', "%{$query}%")
            ->limit(20)
            ->get();

        return $this->success($stocks);
    }

    /**
     * Get live NGX stocks data with compliance status and latest price.
     */
    public function ngx(): JsonResponse
    {
        $stocks = \Illuminate\Support\Facades\Cache::rememberForever('stocks.ngx', function () {
            return Company::with([
                'status',
                'dailyPrices' => fn($q) => $q->latest('date')->limit(2),
            ])->get()->map(function ($company) {
                $prices   = $company->dailyPrices;
                $latest   = $prices->first();
                $prev     = $prices->skip(1)->first();

                $latestPrice = (float) ($latest?->price ?? 0);
                $prevPrice   = (float) ($prev?->price ?? $latestPrice);

                $change    = $latestPrice - $prevPrice;
                $changePct = $prevPrice > 0 ? round(($change / $prevPrice) * 100, 2) : 0;

                $company->latest_price      = $latestPrice;
                $company->price_change      = round($change, 2);
                $company->price_change_pct  = $changePct;

                return $company;
            });
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

        $status = $company->status()->updateOrCreate(
            ['company_id' => $company->id],
            [
                'status'             => $request->status,
                'reason'             => 'Scholar Override: ' . $request->reason,
                'verified_by_scholar' => true,
                'last_updated'       => now(),
            ]
        );

        event(new \App\Events\StockStatusChanged($company, $status));

        // Clear caches so the new status reflects immediately
        \Illuminate\Support\Facades\Cache::forget('stocks.index');
        \Illuminate\Support\Facades\Cache::forget('stocks.ngx');
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
}
