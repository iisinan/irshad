<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use App\Services\AaoifiComplianceService;

class VerifyCompliance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:verify-compliance';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify compliance of all currently halal stocks to ensure accuracy against latest AAOIFI criteria.';

    /**
     * Execute the console command.
     */
    public function handle(AaoifiComplianceService $aaoifiService)
    {
        $this->info('Starting compliance verification for Halal stocks...');

        // Get all stocks currently marked as halal
        $halalStocks = Company::where('current_status', 'halal')->get();
        $count = $halalStocks->count();
        $this->info("Found {$count} halal stocks to verify.");

        $discrepancies = 0;

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        foreach ($halalStocks as $company) {
            // Evaluating will automatically stage a review if status changes.
            $result = $aaoifiService->evaluate($company);
            
            // Re-fetch current_status to see if it changed or if a review was staged
            // Actually, evaluate returns the stockStatus or an object with 'status' => 'pending'
            
            // Let's check if the returned status from evaluation indicates a difference.
            if (isset($result->status) && $result->status !== 'halal') {
                $discrepancies++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        if ($discrepancies > 0) {
            $this->warn("Verification complete. Found {$discrepancies} stocks that no longer meet Halal criteria based on current data.");
            $this->info("Compliance reviews have been staged for these discrepancies. Check the admin dashboard.");
        } else {
            $this->info('Verification complete. All Halal stocks are fully compliant!');
        }
    }
}
