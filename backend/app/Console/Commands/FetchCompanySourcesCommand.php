<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\DataSource;
use App\Services\AfricanFinancialsService;
use App\Services\SimplyWallStService;
use Illuminate\Console\Command;

class FetchCompanySourcesCommand extends Command
{
    protected $signature = 'data:fetch-sources {--symbol= : The specific symbol to fetch (e.g. MTNN)}';
    protected $description = 'Fetch company profile data from multiple sources and store in data_sources table';

    public function handle(AfricanFinancialsService $afService, SimplyWallStService $swsService)
    {
        $symbol = $this->option('symbol');
        
        $query = Company::query();
        if ($symbol) {
            $query->where('symbol', $symbol);
        }
        
        $companies = $query->get();
        $this->info("Fetching sources for {$companies->count()} companies...");
        
        foreach ($companies as $company) {
            $this->info("Fetching for {$company->symbol}...");
            
            // 1. African Financials
            $afData = $afService->fetchProfile($company->symbol);
            if ($afData) {
                DataSource::updateOrCreate(
                    ['company_id' => $company->id, 'source_name' => 'AfricanFinancials'],
                    ['raw_data' => json_encode($afData)]
                );
            }
            
            // 2. Simply Wall St
            $swsData = $swsService->fetchProfile($company->symbol);
            if ($swsData) {
                DataSource::updateOrCreate(
                    ['company_id' => $company->id, 'source_name' => 'SimplyWallSt'],
                    ['raw_data' => json_encode($swsData)]
                );
            }
            
            $this->info("Saved sources for {$company->symbol}");
            usleep(200000); // Respect rate limits
        }
        
        $this->info("Done fetching sources.");
    }
}
