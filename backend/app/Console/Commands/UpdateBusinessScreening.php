<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UpdateBusinessScreening extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'irshad:update-business';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Trigger the AI engine to update business screening news for all companies twice daily';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting twice-daily business intelligence screening...');

        $companies = Company::all();
        $engineUrl = env('AI_ENGINE_URL', 'http://127.0.0.1:8000');

        foreach ($companies as $company) {
            $this->info("Triggering business screening for {$company->symbol}...");
            try {
                // The AI Engine will now automatically run business screening first,
                // and thanks to caching, it will skip PDF extraction if already done.
                $response = Http::timeout(300)->post("{$engineUrl}/api/screen-company/{$company->symbol}", [
                    'financial_year' => 2026
                ]);

                if ($response->successful()) {
                    $this->info("✅ {$company->symbol} updated successfully.");
                } else {
                    $this->error("❌ Failed to update {$company->symbol}. Engine returned: " . $response->status());
                    Log::error("Business screening update failed for {$company->symbol}: " . $response->body());
                }
            } catch (\Exception $e) {
                $this->error("❌ Exception for {$company->symbol}: " . $e->getMessage());
                Log::error("Business screening exception for {$company->symbol}: " . $e->getMessage());
            }
        }

        $this->info('Business intelligence update complete.');
    }
}
