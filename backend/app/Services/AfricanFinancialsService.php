<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AfricanFinancialsService
{
    public function fetchProfile(string $symbol): ?array
    {
        $url = "https://africanfinancials.com/company/ng-" . strtolower($symbol) . "/";
        
        try {
            $response = Http::timeout(10)->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            ])->get($url);

            if ($response->successful()) {
                $html = $response->body();
                
                $sector = null;
                if (preg_match('/Sector:.*?<span[^>]*>(.*?)<\/span>/is', $html, $matches)) {
                    $sector = trim(strip_tags($matches[1]));
                }
                
                $industry = null;
                if (preg_match('/Industry:.*?<span[^>]*>(.*?)<\/span>/is', $html, $matches)) {
                    $industry = trim(strip_tags($matches[1]));
                }
                
                $description = null;
                if (preg_match('/<div class="company-description.*?>(.*?)<\/div>/is', $html, $matches) || preg_match('/class="profile-description"[^>]*>(.*?)<\/div>/is', $html, $matches)) {
                    $description = trim(strip_tags($matches[1]));
                }
                
                return [
                    'source' => 'AfricanFinancials',
                    'sector' => $sector,
                    'industry' => $industry,
                    'description' => $description,
                ];
            }
        } catch (\Exception $e) {
            Log::error("AfricanFinancials fetch failed for {$symbol}: " . $e->getMessage());
        }
        
        return null;
    }
}
