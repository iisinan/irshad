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

        Log::info("Starting background screening for {$this->ticker}");

        $aiUrl = env('AI_ENGINE_URL', 'http://127.0.0.1:8000');
        $response = Http::timeout(900)->post("{$aiUrl}/api/screen-company/{$this->ticker}");

        if ($response->failed()) {
            $error = $response->json('detail') ?? $response->body();
            Log::error("Failed screening for {$this->ticker}: {$error}");
            throw new \Exception("AI Engine Error: " . $error);
        }

        Log::info("Successfully completed screening for {$this->ticker}");
    }
}
