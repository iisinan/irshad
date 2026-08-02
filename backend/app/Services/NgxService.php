<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
                'Accept' => 'application/json',
            ])->timeout(20)->get(self::NGX_API.'/statistics/ticker', [
                '$filter' => "TickerType eq 'EQUITIES'",
            ]);

            if ($response->successful()) {
                $prices = [];
                foreach ($response->json() as $item) {
                    $symbol = trim($item['SYMBOL'] ?? '');
                    if ($symbol && isset($item['Value'])) {
                        $prices[$symbol] = [
                            'price' => (float) $item['Value'],
                            'change_pct' => (float) ($item['PercChange'] ?? 0),
                        ];
                    }
                }

                return $prices;
            }
        } catch (\Exception $e) {
            Log::error('NGX live price fetch failed: '.$e->getMessage());
        }

        return [];
    }

    /**
     * Previously fetched supplemental fundamental data from Yahoo Finance.
     * Removed per user request. Now returns empty structure.
     */
    public function fetchFundamentals(Company $company): array
    {
        return [
            'sector' => null,
            'industry' => null,
            'overview' => null,
            'analysts_target' => null,
            'dividend_yield' => null,
            'market_cap' => 0,
            'total_assets' => 0,
            'total_debt' => 0,
            'total_revenue' => 0,
            'interest_income' => 0,
            'eps' => null,
            'pe_ratio' => null,
            'roe' => null,
            'profit_margin' => null,
        ];
    }

    /**
     * Legacy method — kept for backward compatibility.
     * Uses NGX API for price.
     */
    public function fetchAtomicData(Company $company): array
    {
        $symbol = trim($company->symbol);
        $livePrices = Cache::remember('ngx_live_prices', 300, fn () => $this->fetchAllLivePrices());

        $priceData = $livePrices[$symbol] ?? null;
        $fundamentals = $this->fetchFundamentals($company);

        // Fallback to DB if NGX API doesn't have this symbol
        $price = $priceData ? $priceData['price'] : 0;
        $prevPrice = $price; // NGX API only gives current price; yesterday's comes from DB

        if ($price == 0) {
            $latestDb = $company->dailyPrices()->latest('date')->first();
            $price = $latestDb?->price ?? 0;
            $prevPrice = $company->dailyPrices()->latest('date')->skip(1)->first()?->price ?? $price;
        }

        return array_merge($fundamentals, [
            'symbol' => $symbol,
            'price' => $price,
            'prev_price' => $prevPrice,
        ]);
    }
}
