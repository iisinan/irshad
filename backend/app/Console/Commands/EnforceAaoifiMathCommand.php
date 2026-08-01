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

            $changed = false;
            $oldFinalStatus = $screening->final_status;

            // Recalculate debt status
            if ($screening->debt_ratio !== null) {
                $expectedDebt = $screening->debt_ratio <= 30 ? 'pass' : ($screening->debt_ratio <= 33 ? 'warning' : 'fail');
                if ($screening->debt_status !== $expectedDebt) {
                    $screening->debt_status = $expectedDebt;
                    $changed = true;
                }
            }

            // Recalculate cash status
            if ($screening->cash_ratio !== null) {
                $expectedCash = $screening->cash_ratio <= 30 ? 'pass' : ($screening->cash_ratio <= 33 ? 'warning' : 'fail');
                if ($screening->cash_status !== $expectedCash) {
                    $screening->cash_status = $expectedCash;
                    $changed = true;
                }
            }

            // Recalculate income status
            if ($screening->impermissible_income_ratio !== null) {
                $expectedInc = $screening->impermissible_income_ratio <= 5 ? 'pass' : 'fail';
                if ($screening->impermissible_income_status !== $expectedInc) {
                    $screening->impermissible_income_status = $expectedInc;
                    $changed = true;
                }
            }

            // Determine what final status SHOULD be
            // ONLY halal business activities proceed to stage 2 (financial) screening.
            if ($screening->business_status === 'fail' || $screening->business_status === 'non-halal') {
                $expectedFinalStatus = 'non-halal';
            } elseif ($screening->business_status === 'warning' || $screening->business_status === 'doubtful' || $screening->business_status === 'insufficient_data') {
                $expectedFinalStatus = 'doubtful';
            } else {
                // Stage 2: Financial Screening (only if business activity is halal/pass)
                if ($screening->debt_status === 'fail' || $screening->cash_status === 'fail' || $screening->impermissible_income_status === 'fail') {
                    $expectedFinalStatus = 'non-halal';
                } elseif (in_array($screening->debt_status, ['warning', 'doubtful', 'insufficient_data']) || 
                          in_array($screening->cash_status, ['warning', 'doubtful', 'insufficient_data']) || 
                          in_array($screening->impermissible_income_status, ['warning', 'doubtful', 'insufficient_data'])) {
                    $expectedFinalStatus = 'doubtful';
                } else {
                    $expectedFinalStatus = 'halal';
                }
            }

            if ($screening->final_status !== $expectedFinalStatus) {
                $screening->final_status = $expectedFinalStatus;
                $changed = true;
            }

            if ($changed) {
                $screening->save();
            }

            // We only want to update the reason if the company fails math, OR if its current status is different.
            $needsUpdate = ($company->current_status !== $expectedFinalStatus) || 
                           ($statusModel && $statusModel->reason === 'Status automatically corrected to match AAOIFI mathematical evaluation.');

            if ($needsUpdate) {
                $reasonParts = [];
                if ($expectedFinalStatus === 'halal') {
                    $mathReason = 'Passes both qualitative business and quantitative financial Shariah compliance checks.';
                } else {
                    if ($screening->debt_status === 'fail') {
                        $reasonParts[] = 'Interest-Bearing Debt (' . round($screening->debt_ratio, 2) . '% > 30%)';
                    }
                    if ($screening->cash_status === 'fail') {
                        $reasonParts[] = 'Cash and Equivalents (' . round($screening->cash_ratio, 2) . '% > 30%)';
                    }
                    if ($screening->impermissible_income_status === 'fail') {
                        $reasonParts[] = 'Impermissible Income (' . round($screening->impermissible_income_ratio, 2) . '% > 5%)';
                    }
                    if ($screening->business_status === 'fail') {
                        $reasonParts[] = 'Prohibited Business Activity';
                    }
                    
                    if (!empty($reasonParts)) {
                        $mathReason = 'Fails AAOIFI mathematical screening: ' . implode(', ', $reasonParts) . '.';
                    } else {
                        $mathReason = 'Fails Shariah compliance based on current financial disclosures or business activities.';
                    }
                }

                $oldStatus = $company->current_status;
                
                if ($company->current_status !== $expectedFinalStatus) {
                    $company->update(['current_status' => $expectedFinalStatus]);
                }

                // Update StockStatus record
                if ($statusModel) {
                    // Only overwrite the reason if it was the generic one, OR if we are forcing it to non-halal/doubtful due to math.
                    // If it is halal, and we just changed it to halal, maybe we don't have the AI reason, so $mathReason is okay.
                    $statusModel->update([
                        'status' => $expectedFinalStatus,
                        'reason' => $mathReason
                    ]);
                } else {
                    \App\Models\StockStatus::create([
                        'company_id' => $company->id,
                        'status' => $expectedFinalStatus,
                        'reason' => $mathReason,
                        'verified_by_scholar' => false,
                        'last_updated' => now(),
                    ]);
                }

                if ($oldStatus !== $expectedFinalStatus) {
                    \App\Models\ComplianceHistory::create([
                        'company_id' => $company->id,
                        'old_status' => $oldStatus,
                        'new_status' => $expectedFinalStatus,
                        'reason' => $mathReason,
                        'changed_at' => now(),
                    ]);
                    $this->warn("Fixed {$company->symbol}: Was {$oldStatus}, now is {$expectedFinalStatus} based on strict math.");
                } else {
                    $this->info("Updated reason for {$company->symbol}.");
                }
                
                $fixedCount++;
            }
        }

        $this->info("Enforcement complete. Fixed {$fixedCount} companies.");
    }
}
