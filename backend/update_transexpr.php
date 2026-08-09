<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'TRANSEXPR')->first();
if (!$company) {
    echo "TRANSEXPR not found.\n";
    exit;
}

// 1. Update AaoifiScreening
$aaoifi = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
if (!$aaoifi) {
    $aaoifi = new App\Models\AaoifiScreening();
    $aaoifi->company_id = $company->id;
}

$aaoifi->debt_ratio = 0;
$aaoifi->debt_status = 'pass';
$aaoifi->cash_ratio = 29.63;
$aaoifi->cash_status = 'pass';
$aaoifi->impermissible_income_ratio = 23.87;
$aaoifi->impermissible_income_status = 'fail';

$aaoifi->business_status = 'pass';
$aaoifi->business_reasoning = json_encode(['justification' => 'Permissible core activity.']);
$aaoifi->final_status = 'non-halal';
$aaoifi->save();

// 2. Update Financial
$financial = App\Models\Financial::where('company_id', $company->id)->latest()->first();
if ($financial) {
    $financial->total_assets = 750720000;
    $financial->cash_and_equivalents = 317313000;
    $financial->total_debt = 0;
    $financial->total_revenue = 72013000;
    $financial->interest_income = 17187000;
    $financial->save();
} else {
    $financial = new App\Models\Financial();
    $financial->company_id = $company->id;
    $financial->total_assets = 750720000;
    $financial->cash_and_equivalents = 317313000;
    $financial->total_debt = 0;
    $financial->total_revenue = 72013000;
    $financial->interest_income = 17187000;
    $financial->reporting_period = 'Q2';
    $financial->save();
}

// 3. Update StockStatus
$status = App\Models\StockStatus::where('company_id', $company->id)->first();
if ($status) {
    $status->status = 'non-halal';
    $status->reason = 'Failed Stage 2: Impermissible Income Ratio (23.87%) exceeds the 5% threshold.';
    $status->save();
} else {
    $status = new App\Models\StockStatus();
    $status->company_id = $company->id;
    $status->status = 'non-halal';
    $status->reason = 'Failed Stage 2: Impermissible Income Ratio (23.87%) exceeds the 5% threshold.';
    $status->save();
}

// Clear Cache
Artisan::call('cache:clear');

echo "TRANSEXPR updated successfully!\n";
