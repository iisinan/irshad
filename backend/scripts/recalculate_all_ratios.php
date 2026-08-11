<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AaoifiScreening;
use App\Models\Company;
use App\Models\StockStatus;
use App\Models\ComplianceHistory;
use Illuminate\Support\Facades\DB;

// Disable eloquent events if necessary, or just run normally
app()->instance('verdict.unlock', true);

echo "Starting strict Market Cap recalculation for all AAOIFI screenings...\n\n";

$screenings = AaoifiScreening::with('company.status')->get();
$updatedCount = 0;
$changedStatusCount = 0;

foreach ($screenings as $screening) {
    $company = $screening->company;
    if (!$company) continue;

    $symbol = $company->symbol;
    
    // Ignore Islamic banks if they are hardcoded
    if ($symbol === 'JAIZBANK') {
        continue;
    }

    $marketCap = (float) $company->market_cap;
    $financials = $screening->financial_data_used ?? [];
    
    // Fallback if market cap is 0 in companies table but somehow in financial_data
    if ($marketCap <= 0 && isset($financials['market_cap'])) {
        $marketCap = (float) $financials['market_cap'];
    }

    $totalDebt = (float) ($financials['total_debt'] ?? 0);
    $cash = (float) ($financials['cash'] ?? 0);
    $interestBearingSecurities = (float) ($financials['interest_bearing_securities'] ?? 0);

    // Strictly enforce Market Cap math
    $debtRatio = null;
    $debtStatus = 'insufficient_data';
    $cashRatio = null;
    $cashStatus = 'insufficient_data';

    if ($marketCap > 0) {
        $debtRatio = ($totalDebt / $marketCap);
        $debtStatus = $debtRatio <= 0.30 ? 'pass' : 'fail';
        
        $cashRatio = (($cash + $interestBearingSecurities) / $marketCap);
        $cashStatus = $cashRatio <= 0.30 ? 'pass' : 'fail';
    } else {
        // If market cap is missing/0, it automatically fails (infinite ratio)
        $debtStatus = 'fail';
        $cashStatus = 'fail';
    }

    // Save back to screening
    $screening->debt_ratio = $debtRatio;
    $screening->debt_status = $debtStatus;
    $screening->cash_ratio = $cashRatio;
    $screening->cash_status = $cashStatus;
    
    $impIncomeStatus = $screening->impermissible_income_status;
    $businessStatus = $screening->business_status;

    // Recalculate Final Status
    $finalStatus = 'halal';
    if ($businessStatus === 'fail' || $debtStatus === 'fail' || $cashStatus === 'fail' || $impIncomeStatus === 'fail') {
        $finalStatus = 'non-halal';
    } elseif ($businessStatus === 'warning' || $businessStatus === 'doubtful' || $debtStatus === 'insufficient_data' || $cashStatus === 'insufficient_data') {
        $finalStatus = 'doubtful';
    }

    $oldStatus = $screening->final_status;
    $screening->final_status = $finalStatus;
    
    // Update financial_data_used to reflect strict market cap
    $financials['market_cap'] = $marketCap;
    $screening->financial_data_used = $financials;

    $screening->save();

    // Now update company and stock_status if no manual override
    $stockStatus = $company->status()->first();
    $isVerified = $stockStatus && $stockStatus->verified_by_scholar;

    if (!$isVerified) {
        $oldCompanyStatus = $company->current_status;
        
        if ($oldCompanyStatus !== $finalStatus) {
            $company->update(['current_status' => $finalStatus]);
            
            $reason = "Status updated by strict Market Cap recalculation. ";
            if ($finalStatus === 'non-halal') {
                $reason .= "Failed AAOIFI financial ratio screening.";
            }

            StockStatus::updateOrCreate(
                ['company_id' => $company->id],
                [
                    'status' => $finalStatus,
                    'reason' => $reason,
                    'verified_by_scholar' => false,
                    'last_updated' => now(),
                ]
            );

            ComplianceHistory::create([
                'company_id' => $company->id,
                'old_status' => $oldCompanyStatus,
                'new_status' => $finalStatus,
                'reason' => 'System-wide Market Cap enforcement',
                'changed_at' => now(),
            ]);
            
            $changedStatusCount++;
            echo "   -> [CHANGED] {$symbol}: {$oldCompanyStatus} -> {$finalStatus}\n";
        }
    } else {
        if ($oldStatus !== $finalStatus) {
             echo "   -> [IGNORED OVERRIDE] {$symbol}: Math status is now {$finalStatus} but keeping override: {$stockStatus->status}\n";
        }
    }

    $updatedCount++;
}

echo "\nFinished processing {$updatedCount} screenings.\n";
echo "Total companies with changed overall compliance status: {$changedStatusCount}\n";

// Clear caches
\Illuminate\Support\Facades\Artisan::call('cache:clear');
echo "Caches cleared successfully.\n";

