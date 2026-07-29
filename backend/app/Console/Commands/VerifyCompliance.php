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
        $this->info('Starting compliance verification for all stocks...');

        // Get all stocks
        $stocks = Company::all();
        $count = $stocks->count();
        $this->info("Found {$count} stocks to verify.");

        $discrepancies = 0;

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        foreach ($stocks as $company) {
            $financials = $company->financials()->latest()->first();
            if (!$financials) {
                continue;
            }
            
            $oldStatus = $company->current_status;
            // Evaluating will automatically stage a review if status changes, or auto-apply if it failed business activity.
            $result = $aaoifiService->evaluateCompliance($company, $financials, $company->sector);
            
            // Check if status changed
            if (isset($result->status) && $result->status !== $oldStatus && $result->status !== 'pending') {
                $discrepancies++;
            } elseif (isset($result->status) && $result->status === 'pending') {
                // Means a review was staged, which is also a discrepancy from current state
                $discrepancies++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        if ($discrepancies > 0) {
            $this->warn("Verification complete. Found {$discrepancies} stocks with incorrect status or staged for review.");
            $this->info("Compliance reviews have been staged for these discrepancies (except Rule 1 violations which auto-apply). Check the admin dashboard.");
        } else {
            $this->info('Verification complete. All stocks are correctly synced with AAOIFI rules!');
        }
    }
}
