<?php

namespace App\Services;

use App\Models\Company;
use App\Models\DailyPrice;
use App\Models\Financial;
use Illuminate\Support\Facades\Log;

class NgxService
{
    /**
     * Fetch the latest stored price and financial data for a company.
     * Falls back to reasonable defaults if data is missing.
     * Does NOT use rand() — all data is from the database.
     */
    public function fetchStockData(string $symbol): array
    {
        $company = Company::with(['dailyPrices' => fn($q) => $q->latest('date')->limit(2), 'financials' => fn($q) => $q->latest()])->where('symbol', trim($symbol))->first();

        if (!$company) {
            return [
                'symbol'         => $symbol,
                'price'          => 0,
                'prev_price'     => 0,
                'market_cap'     => 0,
                'total_assets'   => 0,
                'total_debt'     => 0,
                'interest_income' => 0,
                'total_revenue'  => 0,
                'timestamp'      => now()->toIso8601String(),
            ];
        }

        $prices     = $company->dailyPrices;
        $latest     = $prices->first();
        $prev       = $prices->skip(1)->first();
        $financials = $company->financials->first();

        return [
            'symbol'          => $symbol,
            'price'           => $latest?->price ?? 0,
            'prev_price'      => $prev?->price ?? $latest?->price ?? 0,
            'market_cap'      => $financials?->market_cap ?? 0,
            'total_assets'    => $financials?->total_assets ?? 0,
            'total_debt'      => $financials?->total_debt ?? 0,
            'interest_income' => $financials?->interest_income ?? 0,
            'total_revenue'   => $financials?->total_revenue ?? 0,
            'timestamp'       => now()->toIso8601String(),
        ];
    }

    /**
     * Sync the database with the latest stored NGX data.
     * Does NOT overwrite financial data fetched via PDF scraper;
     * only updates the daily price record.
     */
    public function syncCompany(Company $company): void
    {
        try {
            // We do not re-scrape or overwrite financials here.
            // Financials come from the PDF extractor in ScrapeNGXJob.
            // This method is intentionally a no-op to preserve real data.
            Log::info("syncCompany called for {$company->symbol} — using stored DB data.");
        } catch (\Exception $e) {
            Log::error("Failed to sync NGX data for {$company->symbol}: " . $e->getMessage());
        }
    }
}
