<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Services\PerplexityAiService;
use Illuminate\Support\Facades\Cache;

class BulkStage1Screening extends Command
{
    protected $signature = 'irshad:bulk-stage1
                            {--force : Re-screen all stocks, even ones that already have a result}
                            {--missing : Only screen stocks with the fallback/error message}
                            {--symbol= : Screen a single stock by symbol}';

    protected $description = 'Run Perplexity Stage 1 business activity screening for all stocks.';

    public function handle(): int
    {
        $perplexity = new PerplexityAiService();
        $force = $this->option('force');
        $missingOnly = $this->option('missing');
        $singleSymbol = $this->option('symbol');

        $query = Company::query();
        if ($singleSymbol) {
            $query->where('symbol', strtoupper($singleSymbol));
        }
        $companies = $query->get();

        if ($companies->isEmpty()) {
            $this->error('No companies found.');
            return 1;
        }

        $this->info("Found {$companies->count()} companies. Starting Stage 1 screening...");
        $this->newLine();

        $bar = $this->output->createProgressBar($companies->count());
        $bar->start();

        $passed = 0;
        $failed = 0;
        $skipped = 0;
        $errors = 0;

        $fallbackPhrases = [
            'AI screening failed',
            'Assumed compliant',
            'assumed compliant',
            'currently unavailable',
            'AI screening skipped',
        ];

        foreach ($companies as $company) {
            $cacheKey = "aaoifi_stage1_{$company->symbol}";
            $fallbackKey = "aaoifi_stage1_{$company->symbol}_fallback";
            $screening = AaoifiScreening::where('company_id', $company->id)->first();

            // Determine if we should skip
            if (!$force && !$singleSymbol) {
                $existingReason = $screening?->business_reasoning ?? '';
                $hasFallback = false;
                foreach ($fallbackPhrases as $phrase) {
                    if (str_contains($existingReason, $phrase)) {
                        $hasFallback = true;
                        break;
                    }
                }

                // If --missing flag: only process ones with no result or fallback message
                if ($missingOnly && !$hasFallback && $screening?->business_status) {
                    $bar->advance();
                    $skipped++;
                    continue;
                }

                // Without flags: skip if already has a good result
                if (!$missingOnly && $screening?->business_status && !$hasFallback) {
                    $bar->advance();
                    $skipped++;
                    continue;
                }
            }

            try {
                // Clear stale cache
                Cache::forget($cacheKey);

                $result = $perplexity->runBusinessActivityScreening($company);

                $stage1Pass = ($result['compliance_status'] ?? 'PASS') === 'PASS';
                $businessStatus = $stage1Pass ? 'pass' : 'fail';
                $reason = $result['reason'] ?? '';

                // Persist into aaoifi_screenings DB record
                AaoifiScreening::updateOrCreate(
                    ['company_id' => $company->id],
                    [
                        'business_status'    => $businessStatus,
                        'business_reasoning' => $reason,
                    ]
                );

                // Cache fresh result for 7 days + long-term fallback
                Cache::put($cacheKey, $result, now()->addDays(7));
                Cache::put($fallbackKey, $result, now()->addDays(365));

                if ($stage1Pass) {
                    $passed++;
                } else {
                    $failed++;
                    $this->newLine();
                    $this->warn("  ✗ [{$company->symbol}] FAIL — {$reason}");
                }

            } catch (\Exception $e) {
                $errors++;
                $this->newLine();
                $this->error("  ✗ [{$company->symbol}] Error: " . $e->getMessage());
            }

            $bar->advance();

            // Rate limit: 1 request per second to avoid hitting API limits
            sleep(1);
        }

        $bar->finish();
        $this->newLine(2);

        $this->table(
            ['Result', 'Count'],
            [
                ['✓ Passed (Halal)', $passed],
                ['✗ Failed (Non-Halal)', $failed],
                ['→ Skipped (already done)', $skipped],
                ['! Errors', $errors],
            ]
        );

        $this->info('Stage 1 bulk screening complete.');

        return 0;
    }
}
