<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ScrapeNGXData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:scrape-ngx';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatches the job to scrape live financial data from NGX.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Dispatching NGX scraping job...');
        \App\Jobs\ScrapeNGXJob::dispatch();
        $this->info('Job dispatched successfully.');
    }
}
