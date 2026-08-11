<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$company = \App\Models\Company::where('symbol', 'HONYFLOUR')->first();
$screening = $company->aaoifiScreening;
$statusModel = $company->status()->first();

$changed = false;
$expectedDebt = $screening->debt_ratio <= 30 ? 'pass' : ($screening->debt_ratio <= 33 ? 'warning' : 'fail');
if ($screening->debt_status !== $expectedDebt) {
    echo "Updating debt status from {$screening->debt_status} to {$expectedDebt}\n";
    $screening->debt_status = $expectedDebt;
    $changed = true;
}

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
echo "Expected final status: $expectedFinalStatus\n";

if ($screening->final_status !== $expectedFinalStatus) {
    echo "Updating final status from {$screening->final_status} to {$expectedFinalStatus}\n";
    $screening->final_status = $expectedFinalStatus;
    $changed = true;
}

if ($changed) {
    echo "Saving screening...\n";
    $screening->save();
}
