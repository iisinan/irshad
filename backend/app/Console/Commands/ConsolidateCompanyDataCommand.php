<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\DataSource;
use App\Services\GeminiAiService;
use Illuminate\Console\Command;

class ConsolidateCompanyDataCommand extends Command
{
    protected $signature = 'data:consolidate {--symbol= : The specific symbol to consolidate (e.g. MTNN)}';
    protected $description = 'Consolidate multiple data sources into a Golden Record using Gemini';

    public function handle(GeminiAiService $aiService)
    {
        $symbol = $this->option('symbol');
        
        $query = Company::with('dataSources');
        if ($symbol) {
            $query->where('symbol', $symbol);
        }
        
        $companies = $query->get();
        $this->info("Consolidating data for {$companies->count()} companies...");
        
        foreach ($companies as $company) {
            $this->info("Consolidating for {$company->symbol}...");
            
            $sourcesData = [];
            foreach ($company->dataSources as $source) {
                $raw = json_decode($source->raw_data, true);
                if ($raw) {
                    $sourcesData[$source->source_name] = $raw;
                }
            }
            
            // Add current company state as a baseline
            $sourcesData['Current_DB'] = [
                'sector' => $company->sector,
                'industry' => $company->industry,
                'business_type' => $company->business_type,
                'description' => $company->description,
            ];

            $goldenRecord = null;
            $retries = 3;
            while ($retries > 0 && $goldenRecord === null) {
                $goldenRecord = $aiService->consolidateCompanyData($company->symbol, $sourcesData);
                if ($goldenRecord === null) {
                    $retries--;
                    if ($retries > 0) {
                        $this->warn("Retrying {$company->symbol} in 3 seconds... ({$retries} retries left)");
                        sleep(3);
                    }
                }
            }
            
            if ($goldenRecord && isset($goldenRecord['sector'])) {
                $company->update([
                    'sector' => $goldenRecord['sector'],
                    'industry' => $goldenRecord['industry'] ?? $company->industry,
                    'business_type' => $goldenRecord['business_type'] ?? $company->business_type,
                    'description' => $goldenRecord['description'] ?? $company->description,
                ]);
                $this->info("Successfully updated Golden Record for {$company->symbol}. Sector: {$goldenRecord['sector']}");
            } else {
                $this->error("Failed to generate Golden Record for {$company->symbol}");
            }
            
            usleep(500000); // 500ms delay to respect Gemini rate limits
        }
        
        $this->info("Done consolidating data.");
    }
}
