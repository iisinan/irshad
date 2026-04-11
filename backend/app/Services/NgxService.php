<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Financial;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NgxService
{
    protected string $baseUrl = 'https://api.ngxgroup.com/v1'; // Example placeholder
    protected string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.ngx.key', '');
        $this->baseUrl = config('services.ngx.url', 'https://api.ngxgroup.com/v1');
    }

    /**
     * Fetch latest price and financial indicators for a given symbol.
     */
    public function fetchStockData(string $symbol): array
    {
        // In a real scenario:
        // $response = Http::withHeaders(['X-API-KEY' => $this->apiKey])->get("{$this->baseUrl}/marketdata/{$symbol}");
        // return $response->json();

        // Mocking NGX data for Nigerian stocks
        return [
            'symbol' => $symbol,
            'price' => rand(10, 500),
            'market_cap' => rand(1000000000, 5000000000),
            'total_assets' => rand(2000000000, 8000000000),
            'total_debt' => rand(500000000, 1500000000),
            'interest_income' => rand(1000000, 50000000),
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Sync local database with NGX data.
     */
    public function syncCompany(Company $company): void
    {
        try {
            $data = $this->fetchStockData($company->symbol);

            Financial::updateOrCreate(
                [
                    'company_id' => $company->id,
                    'reporting_period' => now()->format('Y-\QQ'),
                ],
                [
                    'total_assets' => $data['total_assets'],
                    'total_debt' => $data['total_debt'],
                    'interest_income' => $data['interest_income'],
                    'total_revenue' => rand(500000000, 2000000000), // Mocked revenue
                    'net_income' => rand(50000000, 300000000), // Mocked income
                ]
            );

            Log::info("Successfully synced NGX data for {$company->symbol}");
        } catch (\Exception $e) {
            Log::error("Failed to sync NGX data for {$company->symbol}: " . $e->getMessage());
        }
    }
}
