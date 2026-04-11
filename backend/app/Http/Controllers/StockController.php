<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\StockStatus;
use App\Services\NgxService;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends Controller
{
    use ApiResponder;

    protected NgxService $ngxService;

    public function __construct(NgxService $ngxService)
    {
        $this->ngxService = $ngxService;
    }

    /**
     * List all stocks.
     */
    public function index(): JsonResponse
    {
        $stocks = Company::with('status')->get();
        return $this->success($stocks);
    }

    /**
     * Fetch stock details by symbol.
     */
    public function show(string $symbol): JsonResponse
    {
        $stock = Company::with(['status', 'financials'])->where('symbol', $symbol)->firstOrFail();
        return $this->success($stock);
    }

    /**
     * Search stocks by name or symbol.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q');
        
        $stocks = Company::with('status')->where('name', 'LIKE', "%{$query}%")
            ->orWhere('symbol', 'LIKE', "%{$query}%")
            ->limit(10)
            ->get();

        return $this->success($stocks);
    }

    /**
     * Run screening logic for a stock.
     */
    public function check(string $symbol): JsonResponse
    {
        $company = Company::with('financials')->where('symbol', $symbol)->firstOrFail();
        
        // Sync with NGX before checking
        $this->ngxService->syncCompany($company);
        
        $financials = $company->financials()->latest()->first();

        if (!$financials) {
            return $this->error('Financial data not available for screening.', 404);
        }

        $status = 'halal';
        $reasons = [];

        // 1. Business Activity Screening
        $prohibitedBusinesses = ['alcohol', 'gambling', 'banking', 'pork', 'conventional finance'];
        if (in_array(strtolower($company->business_type), $prohibitedBusinesses)) {
            $status = 'non-halal';
            $reasons[] = "Prohibited business activity: {$company->business_type}";
        }

        // 2. Financial Ratio Screening
        if ($financials->total_assets > 0) {
            $debtRatio = ($financials->total_debt / $financials->total_assets) * 100;
            if ($debtRatio > 33) {
                $status = 'non-halal';
                $reasons[] = "Debt ratio is " . number_format($debtRatio, 2) . "%, exceeding AAOIFI threshold (33%)";
            }

            $interestRatio = ($financials->interest_income / $financials->total_assets) * 100; // Using assets as proxy for total revenue if not available
            if ($interestRatio > 5) {
                if ($status !== 'non-halal') $status = 'doubtful';
                $reasons[] = "Interest income is " . number_format($interestRatio, 2) . "%, exceeding threshold (5%)";
            }
        }

        if (empty($reasons)) {
            $reasons[] = "Compliant with AAOIFI business and financial standards.";
        }

        // Update or Create Stock Status
        $company->status()->updateOrCreate(
            ['company_id' => $company->id],
            [
                'status' => $status,
                'reason' => implode(", ", $reasons),
                'last_updated' => now(),
            ]
        );

        return $this->success($company->load('status'), 'Screening completed.');
    }
}
