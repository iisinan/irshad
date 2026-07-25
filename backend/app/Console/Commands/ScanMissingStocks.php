<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use Illuminate\Support\Facades\Http;

class ScanMissingStocks extends Command
{
    protected $signature = 'irshad:scan-missing';
    protected $description = 'Scan only companies that are missing valid financial data';

    public function handle()
    {
        $this->info("Scanning missing stocks...");
        $engineUrl = env('AI_ENGINE_URL', 'http://127.0.0.1:8001');

        $missingJson = file_get_contents(base_path('missing_stocks.json'));
        $missing = json_decode($missingJson, true);

        if (!$missing) {
            $this->error("No missing stocks list found.");
            return;
        }

        foreach ($missing as $ticker) {
            $this->info("Triggering scan for {$ticker}...");
            try {
                $response = Http::timeout(300)->post("{$engineUrl}/api/screen-company/{$ticker}", [
                    'financial_year' => 2025
                ]);

                if ($response->successful()) {
                    $this->info("✅ {$ticker} scanned successfully.");
                } else {
                    $this->error("❌ Failed to scan {$ticker}. HTTP " . $response->status());
                }
            } catch (\Exception $e) {
                $this->error("❌ Exception for {$ticker}: " . $e->getMessage());
            }
        }
        $this->info("Done scanning missing stocks.");
    }
}
