<?php

namespace App\Console\Commands;

use App\Jobs\ProcessCompanyScreening;
use App\Jobs\UpdateMarketData;
use App\Mail\BatchCompletedEmail;
use App\Models\Company;
use Illuminate\Bus\Batch;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Mail;

class DailyNgxScan extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'irshad:daily-scan';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pings the AI Engine to kick off the daily NGX market sweep for new Annual Reports';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Daily financial scan started.');

        $targetYear = date('Y'); // or hardcode 2026 based on your logic
        $companies = Company::where('is_active', true)->get();
        
        $jobs = [];
        $queuedCount = 0;

        foreach ($companies as $company) {
            $status = \App\Models\FinancialStatementStatus::where('company_ticker', $company->symbol)
                ->where('financial_year', $targetYear)
                ->first();

            $shouldQueue = false;

            if (!$status) {
                // Never checked before
                $shouldQueue = true;
            } elseif ($status->status === 'awaiting_report' && (!$status->next_retry_at || $status->next_retry_at->isPast())) {
                // Waiting for report and it's time to retry
                $shouldQueue = true;
            } elseif ($status->status === 'failed') {
                // Failed previously, might want to retry. Optional logic.
                $shouldQueue = true;
            }

            if ($shouldQueue) {
                $jobs[] = new ProcessCompanyScreening($company->symbol);
                $queuedCount++;
            }
        }

        $this->info("{$queuedCount} companies queued (out of {$companies->count()} active).");

        if (empty($jobs)) {
            $this->info('No companies need screening today.');
            return;
        }

        // Dispatch in batches, allowing failures so one bad company doesn't stop the whole sweep
        Bus::batch($jobs)->allowFailures()->then(function (Batch $batch) {
            // All jobs completed successfully...
            Mail::to('iirshad2026@gmail.com')->send(new BatchCompletedEmail(
                $batch->id,
                $batch->totalJobs,
                $batch->processedJobs(),
                $batch->failedJobs
            ));
        })->catch(function (Batch $batch, \Throwable $e) {
            // First batch job failure detected...
        })->finally(function (Batch $batch) {
            // The batch has finished executing (whether successful or not)...
        })->name('Daily NGX Screening')->dispatch();

        $this->info('Background extraction has started.');
    }
}
