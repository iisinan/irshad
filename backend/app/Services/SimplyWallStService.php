<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SimplyWallStService
{
    protected string $baseUrl = 'https://api.simplywall.st/v1'; // Placeholder
    protected string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.simplywallst.key', 'sws_mock_key');
    }

    /**
     * Search for global stocks.
     */
    public function search(string $query): array
    {
        // Mocking global stock search results
        $allStocks = [
            ['symbol' => 'NVDA', 'name' => 'NVIDIA Corp', 'exchange' => 'NASDAQ', 'sector' => 'Technology'],
            ['symbol' => 'AAPL', 'name' => 'Apple Inc', 'exchange' => 'NASDAQ', 'sector' => 'Technology'],
            ['symbol' => 'GOOG', 'name' => 'Alphabet Inc - Class C', 'exchange' => 'NASDAQ', 'sector' => 'Communication'],
            ['symbol' => 'MSFT', 'name' => 'Microsoft Corporation', 'exchange' => 'NASDAQ', 'sector' => 'Technology'],
            ['symbol' => 'AMZN', 'name' => 'Amazon.com Inc.', 'exchange' => 'NASDAQ', 'sector' => 'Consumer Discretionary'],
            ['symbol' => 'TSLA', 'name' => 'Tesla Inc', 'exchange' => 'NASDAQ', 'sector' => 'Consumer Discretionary'],
        ];

        return array_filter($allStocks, function($stock) use ($query) {
            return stripos($stock['symbol'], $query) !== false || stripos($stock['name'], $query) !== false;
        });
    }

    /**
     * Fetch financial health for compliance check.
     */
    public function fetchFinancials(string $symbol): array
    {
        // Mock detailed financial data for global stocks
        return [
            'symbol' => $symbol,
            'market_cap' => rand(500000000, 3000000000),
            'total_debt' => rand(100000000, 1000000000),
            'total_assets' => rand(1000000000, 5000000000),
            'cash_and_short_term_inv' => rand(200000000, 1500000000),
            'interest_income' => rand(5000000, 50000000),
            'revenue' => rand(800000000, 4000000000),
        ];
    }

    /**
     * Fetch company profile (Sector, Industry, Description)
     */
    public function fetchProfile(string $symbol): ?array
    {
        // Simulate an API call to Simply Wall St to get the company profile.
        // SWS usually categorizes companies strictly by global standards (GICS).
        return [
            'source' => 'SimplyWallSt',
            'sector' => 'Financials', // Simulated
            'industry' => 'Banks', // Simulated
            'description' => "{$symbol} operates in the financial sector, providing retail and corporate banking services.",
        ];
    }
}
