<?php

namespace App\Console\Commands;

use App\Models\AaoifiScreening;
use App\Models\Company;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

class SyncExcelStage1Command extends Command
{
    protected $signature = 'compliance:sync-excel-stage1';

    protected $description = 'Sync Stage 1 (Business Activity) status and rationale from Excel JSON extract';

    public function handle()
    {
        $jsonPath = base_path('rephrased_stage1_clean.json');

        if (! File::exists($jsonPath)) {
            $this->error("File not found: {$jsonPath}");

            return 1;
        }

        $data = json_decode(File::get($jsonPath), true);

        if (! $data) {
            $this->error("Invalid JSON data in {$jsonPath}");

            return 1;
        }

        $this->info('Found '.count($data).' records to sync.');

        $updatedCount = 0;
        foreach ($data as $row) {
            $ticker = $row['ticker'];
            $status = strtolower($row['business_status']);
            $reasoning = $row['business_reasoning'];

            $company = Company::where('symbol', $ticker)->first();
            if (! $company) {
                $this->warn("Company not found: {$ticker}");

                continue;
            }

                        $tag = 'Requires Further Review';
            $mainText = $reasoning;
            
            if ($status === 'doubtful') {
                if (preg_match('/(Concerns with.*?|This is a disclosed.*?|raises concerns.*?|This raises concerns.*?|thus constituent weights raise concerns.*?|but concerns with regards.*?|so concerns are with regards.*?|concerns are with regards.*?)$/i', $reasoning, $matches)) {
                    $tag = trim($matches[1]);
                    $mainText = trim(str_replace($matches[1], '', $reasoning));
                }
                $mainText = rtrim($mainText, '. -');
                $reasoning = $mainText . '. ||| ' . $tag;
                
                // Also update stock_statuses reason if it exists
                $stockStatus = \App\Models\StockStatus::where('company_id', $company->id)->first();
                if ($stockStatus && $stockStatus->verified_by_scholar) {
                    $stockStatus->reason = 'Scholar Override: ' . $reasoning;
                    $stockStatus->save();
                }
            }

            $screening = AaoifiScreening::firstOrNew(['company_id' => $company->id]);
            $screening->business_status = $status;
            $screening->business_reasoning = json_encode(['summary' => $reasoning]);
            $screening->save();

            $updatedCount++;
            $this->info("Updated {$ticker}: {$status}");
        }

        $this->info("Successfully updated {$updatedCount} companies.");

        // Re-enforce Math to recalculate final status based on the new business status
        $this->info('Running compliance:enforce-math to update final statuses...');
        Artisan::call('compliance:enforce-math');
        $this->info(Artisan::output());

        return 0;
    }
}
