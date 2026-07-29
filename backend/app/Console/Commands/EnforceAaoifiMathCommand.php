<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AaoifiScreening;
use App\Models\Company;

class EnforceAaoifiMathCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'compliance:enforce-math';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Enforces strict AAOIFI mathematical results on Company status to prevent desynchronization.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting AAOIFI mathematical enforcement...");

        $companies = Company::with(['aaoifiScreening', 'status'])->get();
        $fixedCount = 0;

        foreach ($companies as $company) {
            $screening = $company->aaoifiScreening;
            $statusModel = $company->status()->first();

            if (!$screening) {
                continue;
            }

            // Skip if scholar explicitly overrode the system
            if ($statusModel && $statusModel->verified_by_scholar) {
                continue;
            }

            // Verify the math matches the final status
            $shouldBeFail = (
                $screening->business_status === 'fail' ||
                $screening->debt_status === 'fail' ||
                $screening->cash_status === 'fail' ||
                $screening->impermissible_income_status === 'fail'
            );

            $expectedFinalStatus = $shouldBeFail ? 'non-halal' : $screening->final_status;

            // Fix the screening final status if the math says it should fail but it says halal
            if ($expectedFinalStatus === 'non-halal' && $screening->final_status === 'halal') {
                $screening->update(['final_status' => 'non-halal']);
            }

            // Ensure Company top-level status matches the enforced screening status
            if ($company->current_status !== $expectedFinalStatus) {
                $oldStatus = $company->current_status;
                $company->update(['current_status' => $expectedFinalStatus]);

                // Update StockStatus record
                if ($statusModel) {
                    $statusModel->update([
                        'status' => $expectedFinalStatus,
                        'reason' => 'Status automatically corrected to match AAOIFI mathematical evaluation.'
                    ]);
                } else {
                    \App\Models\StockStatus::create([
                        'company_id' => $company->id,
                        'status' => $expectedFinalStatus,
                        'reason' => 'Status automatically corrected to match AAOIFI mathematical evaluation.',
                        'verified_by_scholar' => false,
                        'last_updated' => now(),
                    ]);
                }

                \App\Models\ComplianceHistory::create([
                    'company_id' => $company->id,
                    'old_status' => $oldStatus,
                    'new_status' => $expectedFinalStatus,
                    'reason' => 'Status automatically corrected to match AAOIFI mathematical evaluation.',
                    'changed_at' => now(),
                ]);

                $this->warn("Fixed {$company->symbol}: Was {$oldStatus}, now is {$expectedFinalStatus} based on strict math.");
                $fixedCount++;
            }
        }

        $this->info("Enforcement complete. Fixed {$fixedCount} companies.");
    }
}
