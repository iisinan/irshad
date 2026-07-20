<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Illuminate\Support\Facades\Log;

class RunNgxScraperJob implements ShouldQueue
{
    use Queueable;

    public $timeout = 3600; // Allow 1 hour for full scrape

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Starting Python NGX Scraper Process...');
        
        $process = new Process(['python3', '/tmp/ngx_full_scraper.py']);
        $process->setTimeout(3600); // 1 hour
        
        try {
            $process->mustRun(function ($type, $buffer) {
                if (Process::ERR === $type) {
                    Log::error('Scraper Err > ' . $buffer);
                } else {
                    Log::info('Scraper Out > ' . $buffer);
                }
            });
            
            Log::info('Python Scraper Completed successfully. Dispatching Artisan import command...');
            
            Artisan::call('ngx:import-profiles');
            
            Log::info('NGX profiles imported successfully.');
            
        } catch (ProcessFailedException $exception) {
            Log::error('The Python scraper failed: ' . $exception->getMessage());
        }
    }
}
