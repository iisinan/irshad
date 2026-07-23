<?php

namespace App\Jobs;

use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UpdateMarketData implements ShouldQueue
{
    use Batchable, Queueable;

    public $ticker;

    public $tries = 3;
    public $timeout = 120; // Faster timeout for market data

    public function backoff()
    {
        return [10, 30, 60];
    }

    /**
     * Create a new job instance.
     */
    public function __construct($ticker)
    {
        $this->ticker = $ticker;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if ($this->batch() && $this->batch()->cancelled()) {
            return;
        }

        Log::info("Updating market data for {$this->ticker}");

        $aiUrl = env('AI_ENGINE_URL', 'http://localhost:8000');
        $response = Http::timeout(120)->post("{$aiUrl}/api/update-market-data/{$this->ticker}");

        if ($response->failed()) {
            $error = $response->json('detail') ?? $response->body();
            Log::error("Failed to update market data for {$this->ticker}: {$error}");
            
            // If it's a 404 Not Found, just return gracefully to prevent endless retries
            if ($response->status() === 404) {
                return;
            }
            throw new \Exception("AI Engine Market Data Error: " . $error);
        }

        $data = $response->json();
        
        $company = \App\Models\Company::where('symbol', $this->ticker)->first();
        if ($company) {
            \App\Models\MarketData::create([
                'company_id' => $company->id,
                'ticker' => $this->ticker,
                'latest_price' => $data['latest_price'] ?? null,
                'daily_change' => $data['daily_change'] ?? null,
                'percentage_change' => $data['percentage_change'] ?? null,
                'market_capitalisation' => $data['market_capitalisation'] ?? null,
                'volume' => $data['volume'] ?? null,
                'shares_outstanding' => $data['shares_outstanding'] ?? null,
                'fifty_two_week_high' => $data['fifty_two_week_high'] ?? null,
                'fifty_two_week_low' => $data['fifty_two_week_low'] ?? null,
                'last_trading_date' => $data['last_trading_date'] ?? null,
                'last_trading_time' => $data['last_trading_time'] ?? null,
                'data_source' => $data['data_source'] ?? null,
                'retrieval_timestamp' => $data['retrieval_timestamp'] ?? null,
            ]);

            // Also update companies table denormalized field if needed
            $company->update([
                'latest_price' => $data['latest_price'] ?? $company->latest_price,
            ]);
        }

        Log::info("Successfully updated market data for {$this->ticker}");
    }
}
