<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use App\Models\Company;
use App\Services\PerplexityAiService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Cache;

$companies = Company::where('is_active', true)->orderBy('symbol')->get();
$aiService = new PerplexityAiService;

$total = $companies->count();
echo "Starting Stage 1 Business Activity Screening for {$total} active companies...\n";

foreach ($companies as $index => $company) {
    $num = $index + 1;
    echo "[{$num}/{$total}] Fetching Stage 1 reasoning for {$company->symbol}...\n";

    // Clear the cache first to force a fresh Perplexity API call
    Cache::forget("aaoifi_stage1_{$company->symbol}");

    try {
        $result = $aiService->runBusinessActivityScreening($company);
        $status = $result['compliance_status'] ?? 'UNKNOWN';
        echo " -> Success! Status: {$status}\n";
    } catch (Exception $e) {
        echo " -> Failed for {$company->symbol}: ".$e->getMessage()."\n";
    }

    // Sleep to avoid hitting Perplexity API rate limits (e.g., 20 RPM or 2/sec limit depending on tier)
    if ($num < $total) {
        sleep(5);
    }
}

echo "Completed!\n";
