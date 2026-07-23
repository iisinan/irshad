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

        $companies = Company::where('is_active', true)->get();
        $totalCompanies = $companies->count();

        $this->info("{$totalCompanies} companies queued.");

        $jobs = [];
        foreach ($companies as $company) {
            $jobs[] = new ProcessCompanyScreening($company->ticker);
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
