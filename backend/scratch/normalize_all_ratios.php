<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;

// Start logging
$log = [];
$updatedCount = 0;
$mismatchCount = 0;

$companies = Company::with('aaoifiScreening', 'status')->get();

foreach ($companies as $c) {
    $aaoifi = $c->aaoifiScreening;
    if (!$aaoifi) continue;
    
    // Parse financial data
    $fin = is_string($aaoifi->financial_data_used) ? json_decode($aaoifi->financial_data_used, true) : $aaoifi->financial_data_used;
    if (!$fin || !isset($fin['market_cap'])) {
        $log[] = "{$c->symbol}: Skipping (No valid financial data)";
        continue;
    }

    $marketCap = floatval($fin['market_cap']);
    $totalDebt = floatval($fin['total_debt'] ?? 0);
    $cash = floatval($fin['cash'] ?? 0);
    $securities = floatval($fin['interest_bearing_securities'] ?? 0);
    $totalRev = floatval($fin['total_revenue'] ?? 0);
    $impInc = floatval($fin['interest_income'] ?? 0);

    // Calculate actual ratios as percentages (0 to 100)
    $actualDebtRatio = $marketCap > 0 ? ($totalDebt / $marketCap) * 100 : 0;
    $actualCashRatio = $marketCap > 0 ? (($cash + $securities) / $marketCap) * 100 : 0;
    $actualImpIncRatio = $totalRev > 0 ? ($impInc / $totalRev) * 100 : 0;

    // Evaluate strictly based on AAOIFI
    $debtStatus = $actualDebtRatio <= 30.00 ? 'pass' : 'fail';
    $cashStatus = $actualCashRatio <= 30.00 ? 'pass' : 'fail';
    $impIncStatus = $actualImpIncRatio <= 5.00 ? 'pass' : 'fail';

    $businessStatus = $aaoifi->business_status ?? 'pass';
    $businessPass = in_array(strtolower($businessStatus), ['pass', 'halal']);

    $newFinalStatus = ($businessPass && $debtStatus === 'pass' && $cashStatus === 'pass' && $impIncStatus === 'pass') ? 'halal' : 'non-halal';

    // Store the accurate values directly (overwriting whatever messed up scale existed)
    $aaoifi->debt_ratio = $actualDebtRatio;
    $aaoifi->cash_ratio = $actualCashRatio;
    $aaoifi->impermissible_income_ratio = $actualImpIncRatio;
    $aaoifi->debt_status = $debtStatus;
    $aaoifi->cash_status = $cashStatus;
    $aaoifi->impermissible_income_status = $impIncStatus;
    
    // If status changed due to this normalization, log it
    $statusChanged = $aaoifi->final_status !== $newFinalStatus;
    $aaoifi->final_status = $newFinalStatus;
    
    $aaoifi->save();

    // Sync Company and StockStatus tables
    if ($c->current_status !== $newFinalStatus) {
        $c->current_status = $newFinalStatus;
        $c->save();
    }

    if ($c->status) {
        if ($c->status->status !== $newFinalStatus) {
            $c->status->status = $newFinalStatus;
            
            // If it became non-halal because of financials, generate a standard reason
            if ($newFinalStatus === 'non-halal' && $businessPass) {
                $failed = [];
                if ($debtStatus === 'fail') $failed[] = "Debt Ratio (" . number_format($actualDebtRatio, 2) . "%)";
                if ($cashStatus === 'fail') $failed[] = "Cash Ratio (" . number_format($actualCashRatio, 2) . "%)";
                if ($impIncStatus === 'fail') $failed[] = "Impermissible Income Ratio (" . number_format($actualImpIncRatio, 2) . "%)";
                
                $c->status->reason = "Permissible core activity. However, it fails the AAOIFI quantitative financial screening due to: " . implode(', ', $failed) . " exceeding limits.";
            } elseif ($newFinalStatus === 'halal') {
                 $c->status->reason = null; // Let the frontend generate standard Halal reason
            }
            $c->status->save();
        }
    } else {
        $c->status()->create([
            'status' => $newFinalStatus, 
            'verified_by_scholar' => false
        ]);
    }

    $updatedCount++;
    if ($statusChanged) {
        $log[] = "{$c->symbol}: STATUS CHANGED to {$newFinalStatus}";
    }
}

echo "Successfully normalized calculations for $updatedCount companies.\n";
if (count($log) > 0) {
    echo "Logs:\n" . implode("\n", $log) . "\n";
}
