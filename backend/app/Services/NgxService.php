<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NgxService
{
    /**
     * Fetch the raw data from Yahoo Finance for a company.
     * Throws an exception if the API crashes (e.g., timeout or 5xx).
     */
    public function fetchAtomicData(Company $company): array
    {
        $symbol = trim($company->symbol);
        $yahooSymbol = str_contains($symbol, '.') ? $symbol : "{$symbol}.LG";
        
        $response = [
            'symbol'          => $symbol,
            'price'           => 0,
            'prev_price'      => 0,
            'market_cap'      => 0,
            'total_assets'    => 0,
            'total_debt'      => 0,
            'interest_income' => 0,
            'total_revenue'   => 0,
            'eps'             => null,
            'pe_ratio'        => null,
            'roe'             => null,
            'dividend_yield'  => null,
            'profit_margin'   => null,
            'timestamp'       => now()->toIso8601String(),
        ];

        // 1. Fetch Quote Data
        try {
            $apiResponse = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept' => 'application/json',
            ])->retry(3, 1000, throw: false)->timeout(10)->get("https://query1.finance.yahoo.com/v8/finance/chart/{$yahooSymbol}");
            
            if ($apiResponse && $apiResponse->successful()) {
                $result = $apiResponse->json('chart.result.0');
                if ($result && isset($result['meta']['regularMarketPrice'])) {
                    $response['price'] = $result['meta']['regularMarketPrice'];
                    $response['prev_price'] = $result['meta']['chartPreviousClose'] ?? $response['price'];
                }
            }
        } catch (\Exception $e) {
            Log::warning("Failed to fetch chart data for {$yahooSymbol}: " . $e->getMessage());
        }

        // 2. Fetch Fundamental Data
        try {
            $fundamentalResponse = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept' => 'application/json',
            ])->retry(3, 1000, throw: false)->timeout(10)->get("https://query2.finance.yahoo.com/v10/finance/quoteSummary/{$yahooSymbol}", [
                'modules' => 'financialData,defaultKeyStatistics,balanceSheetHistory,summaryDetail,summaryProfile'
            ]);

            if ($fundamentalResponse && $fundamentalResponse->successful()) {
                $modules = $fundamentalResponse->json('quoteSummary.result.0');
                if ($modules) {
                    $financialData = $modules['financialData'] ?? [];
                    
                    $response['market_cap'] = $modules['defaultKeyStatistics']['enterpriseValue']['raw'] ?? 0;
                    $response['eps'] = $modules['defaultKeyStatistics']['trailingEps']['raw'] ?? null;
                    $response['pe_ratio'] = $modules['summaryDetail']['trailingPE']['raw'] ?? null;
                    $response['dividend_yield'] = $modules['summaryDetail']['dividendYield']['raw'] ?? null;

                    $response['total_revenue'] = $financialData['totalRevenue']['raw'] ?? 0;
                    $response['total_debt'] = $financialData['totalDebt']['raw'] ?? 0;
                    $response['profit_margin'] = $financialData['profitMargins']['raw'] ?? null;
                    $response['roe'] = $financialData['returnOnEquity']['raw'] ?? null;
                    
                    // Extract sector from summaryProfile
                    $response['sector'] = $modules['summaryProfile']['sector'] ?? null;
                    $response['industry'] = $modules['summaryProfile']['industry'] ?? null;
                    
                    $balanceSheets = $modules['balanceSheetHistory']['balanceSheetStatements'] ?? [];
                    if (!empty($balanceSheets)) {
                        $latestSheet = $balanceSheets[0];
                        $response['total_assets'] = $latestSheet['totalAssets']['raw'] ?? 0;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning("Failed to fetch fundamental data for {$yahooSymbol}: " . $e->getMessage());
        }

        // Fallback to database if Yahoo Finance has 0 price for this symbol (which is common for some NGX stocks)
        if ($response['price'] == 0) {
            $prices = $company->dailyPrices()->latest('date')->limit(2)->get();
            $latest = $prices->first();
            $prev = $prices->skip(1)->first();
            $financials = $company->financials()->latest()->first();

            $response['price'] = $latest?->price ?? 0;
            $response['prev_price'] = $prev?->price ?? $latest?->price ?? 0;
            
            if ($response['market_cap'] == 0) $response['market_cap'] = $financials?->market_cap ?? 0;
            if ($response['total_assets'] == 0) $response['total_assets'] = $financials?->total_assets ?? 0;
            if ($response['total_debt'] == 0) $response['total_debt'] = $financials?->total_debt ?? 0;
            if ($response['total_revenue'] == 0) $response['total_revenue'] = $financials?->total_revenue ?? 0;
            if ($response['interest_income'] == 0) $response['interest_income'] = $financials?->interest_income ?? 0;
        }



        return $response;
    }
}
