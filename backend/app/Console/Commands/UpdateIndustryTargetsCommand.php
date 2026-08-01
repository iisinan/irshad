<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\PerplexityAiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class UpdateIndustryTargetsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'irshad:update-industry-targets';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Use Perplexity AI to update the industry and analyst target for all stocks in the database.';

    /**
     * Execute the console command.
     */
    public function handle(PerplexityAiService $perplexityService)
    {
        $companies = Company::all();
        $total = $companies->count();
        $this->info("Found {$total} companies. Updating industry and analyst target using Perplexity API...");

        $bar = $this->output->createProgressBar($total);

        foreach ($companies as $company) {
            try {
                $result = $perplexityService->fetchIndustryAndTarget($company);

                $target = $result['analysts_target'] ?? 'N/A';
                if (is_string($target)) {
                    $target = preg_replace('/[^\d\.]/', '', $target);
                }

                $company->industry = $result['industry'] ?? 'Unknown';
                $company->analysts_target = is_numeric($target) ? (float) $target : null;
                $company->save();

                $this->info("\nUpdated {$company->symbol}: Industry -> {$result['industry']}, Target -> {$result['analysts_target']}");
            } catch (\Exception $e) {
                Log::error("Failed to update {$company->symbol}: ".$e->getMessage());
                $this->error("\nFailed to update {$company->symbol}. Check logs.");
            }

            // Sleep 2 seconds to avoid hitting rate limits
            sleep(2);
            $bar->advance();
        }

        $bar->finish();
        $this->info("\nAll stocks updated successfully!");
    }
}
