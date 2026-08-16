<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use App\Models\Setting;

class ZakatController extends Controller
{
    /**
     * Get the unified Zakat prices and Nisab thresholds.
     */
    public function getPrices(Request $request)
    {
        // 1. Fetch settings from the database (fallback to empty array if DB fails)
        try {
            $settings = Setting::pluck('value', 'key');
        } catch (\Exception $e) {
            $settings = collect();
        }
        
        $exchangeRate = isset($settings['zakat_exchange_rate']) ? (float)$settings['zakat_exchange_rate'] : 1600.0;
        $overridePrice = isset($settings['zakat_gold_price_override']) ? (float)$settings['zakat_gold_price_override'] : 0.0;
        
        $overrideActive = $overridePrice > 0;
        
        $goldPrice = 0.0;
        $silverPrice = 0.0;
        
        // 2. Determine Gold and Silver prices
        if ($overrideActive) {
            $goldPrice = $overridePrice;
            // Silver price is not typically overridden, but we set it to 0 or we can calculate it
        } else {
            // Fetch from Gold-API with a higher timeout and proper exception handling.
            // We avoid Cache::remember because we don't want to cache failed (0.0) results for 2 hours.
            $goldPriceRaw = Cache::get('live_gold_price_usd');
            if (!$goldPriceRaw) {
                try {
                    $response = Http::timeout(10)->get('https://api.gold-api.com/price/XAU');
                    if ($response->successful()) {
                        $goldPriceRaw = (float)$response->json('price');
                        Cache::put('live_gold_price_usd', $goldPriceRaw, now()->addHours(2));
                    }
                } catch (\Exception $e) {
                    $goldPriceRaw = 0.0;
                }
            }
            
            $silverPriceRaw = Cache::get('live_silver_price_usd');
            if (!$silverPriceRaw) {
                try {
                    $response = Http::timeout(10)->get('https://api.gold-api.com/price/XAG');
                    if ($response->successful()) {
                        $silverPriceRaw = (float)$response->json('price');
                        Cache::put('live_silver_price_usd', $silverPriceRaw, now()->addHours(2));
                    }
                } catch (\Exception $e) {
                    $silverPriceRaw = 0.0;
                }
            }
            
            // Note: gold-api returns price per OUNCE. We need price per GRAM.
            // 1 Troy Ounce = 31.1034768 grams
            // Wait, let's verify if the frontend was dividing by 31.1035.
            // In ZakatTab.jsx: `const perGramUsd = jsonGold.price / 31.1035;`
            
            $goldPrice = $goldPriceRaw > 0 ? ($goldPriceRaw / 31.1035) * $exchangeRate : 0;
            $silverPrice = $silverPriceRaw > 0 ? ($silverPriceRaw / 31.1035) * $exchangeRate : 0;
        }

        // 3. Calculate Nisab
        // Nisab is 85 grams of gold or 595 grams of silver
        $nisabGold = $goldPrice * 85;
        $nisabSilver = $silverPrice * 595;
        
        return response()->json([
            'status' => 'success',
            'data' => [
                'gold_price' => $goldPrice,
                'silver_price' => $silverPrice,
                'nisab_gold' => $nisabGold,
                'nisab_silver' => $nisabSilver,
                'override_active' => $overrideActive,
                'exchange_rate' => $exchangeRate,
            ]
        ]);
    }
}
