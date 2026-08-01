<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;

class SyncExcelStage1Command extends Command
{
    protected $signature = 'compliance:sync-excel-stage1';
    protected $description = 'Sync Stage 1 (Business Activity) status and rationale from Excel JSON extract';

    public function handle()
    {
        $jsonPath = base_path('rephrased_stage1_clean.json');
        
        if (!File::exists($jsonPath)) {
            $this->error("File not found: {$jsonPath}");
            return 1;
        }

        $data = json_decode(File::get($jsonPath), true);
        
        if (!$data) {
            $this->error("Invalid JSON data in {$jsonPath}");
            return 1;
        }

        $this->info("Found " . count($data) . " records to sync.");

        $updatedCount = 0;
        foreach ($data as $row) {
            $ticker = $row['ticker'];
            $status = strtolower($row['business_status']);
            $reasoning = $row['business_reasoning'];

            $company = Company::where('symbol', $ticker)->first();
            if (!$company) {
                $this->warn("Company not found: {$ticker}");
                continue;
            }

            $screening = AaoifiScreening::firstOrNew(['company_id' => $company->id]);
            $screening->business_status = $status;
            $screening->business_reasoning = $reasoning;
            $screening->save();

            $updatedCount++;
            $this->info("Updated {$ticker}: {$status}");
        }

        $this->info("Successfully updated {$updatedCount} companies.");
        
        // Re-enforce Math to recalculate final status based on the new business status
        $this->info("Running compliance:enforce-math to update final statuses...");
        Artisan::call('compliance:enforce-math');
        $this->info(Artisan::output());

        return 0;
    }
}
