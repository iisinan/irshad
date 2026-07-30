<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use App\Services\PerplexityAiService;
use Illuminate\Support\Facades\Cache;

class RefreshBusinessScreening extends Command
{
    protected $signature = 'irshad:refresh-business-screening';
    protected $description = 'Clears the business activity cache for all active companies and runs the Perplexity AI screening with the latest prompt to pre-warm the cache.';

    public function handle()
    {
        $companies = Company::where('is_active', true)->get();
        $total = $companies->count();
        $this->info("Found {$total} active companies to screen.");

        $perplexity = new PerplexityAiService();
        $count = 1;

        foreach ($companies as $company) {
            $this->info("[{$count}/{$total}] Screening {$company->symbol} - {$company->name}...");
            
            $cacheKey = "aaoifi_stage1_{$company->symbol}";
            $fallbackKey = "aaoifi_stage1_{$company->symbol}_fallback";
            
            Cache::forget($cacheKey);
            Cache::forget($fallbackKey);

            try {
                // This calls the AI and waits for the response
                $stage1 = $perplexity->runBusinessActivityScreening($company, true);
                
                Cache::put($cacheKey, $stage1, now()->addDays(7));
                Cache::put($fallbackKey, $stage1, now()->addDays(365));
                
                $status = $stage1['compliance_status'] ?? 'UNKNOWN';
                if ($status === 'PASS') {
                    $this->info("   -> ✅ PASS");
                } else {
                    $this->error("   -> ❌ FAIL");
                }

            } catch (\Exception $e) {
                $this->error("   -> ERROR: " . $e->getMessage());
            }

            // Small delay to respect rate limits
            usleep(1000000); // 1 second
            $count++;
        }

        $this->info("Finished pre-warming business activity screening cache for all stocks!");
        
        // Also run the sync-status command so the database current_status updates immediately
        $this->info("Running sync-status to update DB...");
        $this->call('irshad:sync-status');
    }
}
