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

    $marketCap = (string) $company->market_cap;
    $financials = $screening->financial_data_used;
    if (is_string($financials)) {
        $financials = json_decode($financials, true);
    }
    if (!is_array($financials)) {
        $financials = [];
    }
    
    // Fallback if market cap is 0 in companies table but somehow in financial_data
    if (bccomp($marketCap, '0', 4) <= 0 && isset($financials['market_cap'])) {
        $marketCap = (string) $financials['market_cap'];
    }
    
    $totalAssets = (string) ($financials['total_assets'] ?? 0);
    $denominator = bccomp($marketCap, $totalAssets, 4) === 1 ? $marketCap : $totalAssets;

    $totalDebt = (string) ($financials['total_debt'] ?? 0);
    $cash = (string) ($financials['cash'] ?? 0);
    $interestBearingSecurities = (string) ($financials['interest_bearing_securities'] ?? 0);
    
    $cashAndSecurities = bcadd($cash, $interestBearingSecurities, 4);

    // Strictly enforce Market Cap / Total Assets math using BCMath
    $debtRatio = null;
    $debtStatus = 'insufficient_data';
    $cashRatio = null;
    $cashStatus = 'insufficient_data';

    if (bccomp($denominator, '0', 4) === 1) {
        $debtRatioRaw = bcdiv($totalDebt, $denominator, 6);
        $debtRatio = bcmul($debtRatioRaw, '100', 4); // Format as percentage not decimal?
        // Wait, the original code didn't multiply by 100, it stored it as decimal (e.g. 0.30)
        // If I keep decimal:
        $debtRatio = $debtRatioRaw;
        $debtStatus = bccomp($debtRatio, '0.3000', 4) <= 0 ? 'pass' : 'fail';
        
        $cashRatioRaw = bcdiv($cashAndSecurities, $denominator, 6);
        $cashRatio = $cashRatioRaw;
        $cashStatus = bccomp($cashRatio, '0.3000', 4) <= 0 ? 'pass' : 'fail';
    } else {
        // If denominator is missing/0, it automatically fails (infinite ratio)
        $debtStatus = 'fail';
        $cashStatus = 'fail';
    }

    // Save back to screening
    $screening->debt_ratio = $debtRatio === null ? null : (float) $debtRatio;
    $screening->debt_status = $debtStatus;
    $screening->cash_ratio = $cashRatio === null ? null : (float) $cashRatio;
    $screening->cash_status = $cashStatus;
    
    $impIncomeStatus = $screening->impermissible_income_status;
    $businessStatus = $screening->business_status;

    // Recalculate Final Status
    $finalStatus = 'halal';
    if ($businessStatus === 'fail' || $debtStatus === 'fail' || $cashStatus === 'fail' || $impIncomeStatus === 'fail') {
        $finalStatus = 'non-compliant';
    } elseif ($businessStatus === 'warning' || $businessStatus === 'doubtful' || $debtStatus === 'insufficient_data' || $cashStatus === 'insufficient_data') {
        $finalStatus = 'doubtful';
    }

    $oldStatus = $screening->final_status;
    $screening->final_status = $finalStatus;
    
    // Update financial_data_used to reflect strict denominator logic
    $financials['market_cap'] = (float) $marketCap;
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
            if ($finalStatus === 'non-compliant') {
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

