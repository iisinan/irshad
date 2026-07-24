<?php

namespace App\Jobs;

use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProcessCompanyScreening implements ShouldQueue
{
    use Batchable, Queueable;

    public $ticker;

    public $tries = 3;
    public $timeout = 900; // 15 minutes because Gemini/Apify might take a while

    public function backoff()
    {
        return [30, 120, 300]; // exponential backoff
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

        $targetYear = date('Y'); // The AI defaults to 2026 or the current year logic
        
        $status = \App\Models\FinancialStatementStatus::firstOrCreate(
            ['company_ticker' => $this->ticker, 'financial_year' => $targetYear],
            ['status' => 'pending']
        );

        $status->increment('attempt_count');
        $status->update(['last_checked_at' => now()]);

        Log::info("Starting background screening for {$this->ticker}");

        // Hardcoding to 127.0.0.1:8000 because they run in the same Docker container
        // and the Render dashboard has an incorrect env variable (localhost:8001) that causes curl error 52
        $aiUrl = 'http://127.0.0.1:8000';
        $response = Http::timeout(900)->post("{$aiUrl}/api/screen-company/{$this->ticker}");

        if ($response->failed()) {
            $error = $response->json('detail') ?? $response->body();
            Log::error("Failed screening for {$this->ticker}: {$error}");
            throw new \Exception("AI Engine Error: " . $error);
        }

        $data = $response->json();
        if (isset($data['error']) && $data['error'] === 'File Not Found') {
            $status->update([
                'status' => 'awaiting_report',
                'next_retry_at' => now()->addDays(7), // Retry in 7 days
            ]);
            Log::info("Report not found for {$this->ticker}. Set to awaiting_report.");
            return;
        }

        $status->update(['status' => 'available']);
        Log::info("Successfully completed screening for {$this->ticker}");
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        $targetYear = date('Y');
        
        $status = \App\Models\FinancialStatementStatus::where('company_ticker', $this->ticker)
            ->where('financial_year', $targetYear)
            ->first();
            
        if ($status) {
            $status->update([
                'status' => 'failed',
                'failure_reason' => $exception->getMessage(),
            ]);
        }
    }
}
