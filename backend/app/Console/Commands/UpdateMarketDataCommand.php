<?php

namespace App\Console\Commands;

use App\Jobs\UpdateMarketData;
use App\Models\Company;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Bus;
use Illuminate\Bus\Batch;

class UpdateMarketDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'irshad:market-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatches jobs to update market prices for all active companies twice a day';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Market data sweep started.');

        $companies = Company::where('is_active', true)->get();
        $totalCompanies = $companies->count();

        $this->info("{$totalCompanies} companies queued for market data update.");

        $jobs = [];
        foreach ($companies as $company) {
            $jobs[] = new UpdateMarketData($company->symbol);
        }

        Bus::batch($jobs)->name('Market Data Update')->allowFailures()->dispatch();

        $this->info('Background market data extraction has started.');
    }
}
