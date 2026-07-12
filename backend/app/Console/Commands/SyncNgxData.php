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
        $this->info('Starting chunked NGX data sync...');
        $companies = Company::all();
        
        $chunks = $companies->chunk(20);

        foreach ($chunks as $chunk) {
            \App\Jobs\SyncNgxChunkJob::dispatch($chunk);
        }

        // Clear the cache to ensure new data is served
        Cache::forget('stocks.index');
        Cache::forget('stocks.ngx');
        $this->info('Cleared stock caches.');

        $this->info('NGX data sync jobs dispatched successfully into ' . $chunks->count() . ' chunks of up to 20 companies each.');
    }
}
