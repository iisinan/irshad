<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\NgxService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SyncNgxData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ngx:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync stock prices from Yahoo Finance for all companies';

    /**
     * Execute the console command.
     */
    public function handle(NgxService $ngxService)
    {
        $this->info('Starting NGX data sync...');
        $companies = Company::all();

        $bar = $this->output->createProgressBar(count($companies));

        foreach ($companies as $company) {
            $ngxService->syncCompany($company);
            $bar->advance();
            // Sleep briefly to avoid aggressive rate limiting
            usleep(200000); // 200ms
        }

        $bar->finish();
        $this->newLine();

        // Clear the cache to ensure new data is served
        Cache::forget('stocks.index');
        Cache::forget('stocks.ngx');
        $this->info('Cleared stock caches.');

        $this->info('NGX data sync completed successfully.');
    }
}
