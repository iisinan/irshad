<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class NgxService
{
    /**
     * The official NGX Group REST API base URL (found in their JS source).
     */
    private const NGX_API = 'https://doclib.ngxgroup.com/REST/api';

    /**
     * Fetch all live equities prices from the official NGX REST API in one call.
     * Returns a keyed array: ['SYMBOL' => ['price' => float, 'change_pct' => float], ...]
     */
    public function fetchAllLivePrices(): array
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept'     => 'application/json',
            ])->timeout(20)->get(self::NGX_API . "/statistics/ticker", [
                '$filter' => "TickerType eq 'EQUITIES'",
            ]);

            if ($response->successful()) {
                $prices = [];
                foreach ($response->json() as $item) {
                    $symbol = trim($item['SYMBOL'] ?? '');
                    if ($symbol && isset($item['Value'])) {
                        $prices[$symbol] = [
                            'price'      => (float) $item['Value'],
                            'change_pct' => (float) ($item['PercChange'] ?? 0),
                        ];
                    }
                }
                return $prices;
            }
        } catch (\Exception $e) {
            Log::error('NGX live price fetch failed: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * Fetch supplemental fundamental data from Yahoo Finance for a single company.
     * Used to get sector, industry, PE ratio, EPS, analyst targets, etc.
     * Yahoo Finance does NOT have NGX prices but DOES have fundamental data for large-cap NGX stocks.
     */
    public function fetchFundamentals(Company $company): array
    {
        $symbol      = trim($company->symbol);
        $yahooSymbol = str_contains($symbol, '.') ? $symbol : "{$symbol}.LG";

        $result = [
            'sector'          => null,
            'industry'        => null,
            'analysts_target' => null,
            'dividend_yield'  => null,
            'market_cap'      => 0,
            'total_assets'    => 0,
            'total_debt'      => 0,
            'total_revenue'   => 0,
            'interest_income' => 0,
            'eps'             => null,
            'pe_ratio'        => null,
            'roe'             => null,
            'profit_margin'   => null,
        ];

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept'     => 'application/json',
            ])->retry(2, 500, throw: false)->timeout(12)->get(
                "https://query2.finance.yahoo.com/v10/finance/quoteSummary/{$yahooSymbol}",
                ['modules' => 'financialData,defaultKeyStatistics,balanceSheetHistory,summaryDetail,summaryProfile']
            );

            if ($response && $response->successful()) {
                $modules = $response->json('quoteSummary.result.0');
                if ($modules) {
                    $financialData = $modules['financialData'] ?? [];
                    $keyStats      = $modules['defaultKeyStatistics'] ?? [];
                    $summaryDetail = $modules['summaryDetail'] ?? [];
                    $profile       = $modules['summaryProfile'] ?? [];

                    $result['sector']          = $profile['sector'] ?? null;
                    $result['industry']        = $profile['industry'] ?? null;
                    $result['analysts_target'] = $financialData['targetMeanPrice']['raw'] ?? null;
                    $result['dividend_yield']  = $summaryDetail['dividendYield']['raw'] ?? null;

                    $result['market_cap']     = $keyStats['enterpriseValue']['raw'] ?? 0;
                    $result['eps']            = $keyStats['trailingEps']['raw'] ?? null;
                    $result['pe_ratio']       = $summaryDetail['trailingPE']['raw'] ?? null;
                    $result['total_revenue']  = $financialData['totalRevenue']['raw'] ?? 0;
                    $result['total_debt']     = $financialData['totalDebt']['raw'] ?? 0;
                    $result['profit_margin']  = $financialData['profitMargins']['raw'] ?? null;
                    $result['roe']            = $financialData['returnOnEquity']['raw'] ?? null;

                    $balanceSheets = $modules['balanceSheetHistory']['balanceSheetStatements'] ?? [];
                    if (!empty($balanceSheets)) {
                        $result['total_assets'] = $balanceSheets[0]['totalAssets']['raw'] ?? 0;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning("Yahoo fundamentals fetch failed for {$symbol}: " . $e->getMessage());
        }

        return $result;
    }

    /**
     * Legacy method — kept for backward compatibility.
     * Now uses NGX API for price + Yahoo for fundamentals.
     */
    public function fetchAtomicData(Company $company): array
    {
        $symbol   = trim($company->symbol);
        $livePrices = Cache::remember('ngx_live_prices', 300, fn() => $this->fetchAllLivePrices());

        $priceData   = $livePrices[$symbol] ?? null;
        $fundamentals = $this->fetchFundamentals($company);

        // Fallback to DB if NGX API doesn't have this symbol
        $price    = $priceData ? $priceData['price'] : 0;
        $prevPrice = $price; // NGX API only gives current price; yesterday's comes from DB

        if ($price == 0) {
            $latestDb = $company->dailyPrices()->latest('date')->first();
            $price    = $latestDb?->price ?? 0;
            $prevPrice = $company->dailyPrices()->latest('date')->skip(1)->first()?->price ?? $price;
        }

        return array_merge($fundamentals, [
            'symbol'     => $symbol,
            'price'      => $price,
            'prev_price' => $prevPrice,
        ]);
    }
}
