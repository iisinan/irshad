<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'HONYFLOUR')->first();
if (!$company) {
    echo "HONYFLOUR not found.\n";
    exit;
}

// 1. Update AaoifiScreening
$aaoifi = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
if (!$aaoifi) {
    $aaoifi = new App\Models\AaoifiScreening();
    $aaoifi->company_id = $company->id;
}

$aaoifi->debt_ratio = 13.53;
$aaoifi->debt_status = 'pass';
$aaoifi->cash_ratio = 4.44;
$aaoifi->cash_status = 'pass';
$aaoifi->impermissible_income_ratio = 1.88;
$aaoifi->impermissible_income_status = 'pass';

$aaoifi->business_status = 'pass';
$aaoifi->business_reasoning = json_encode(['justification' => 'Permissible core activity.']);
$aaoifi->final_status = 'compliant';
$aaoifi->save();

// 2. Update Financial
$financial = App\Models\Financial::where('company_id', $company->id)->latest()->first();
if ($financial) {
    $financial->total_assets = 310180000000;
    $financial->cash_and_equivalents = 13778000000;
    $financial->total_debt = 41973000000;
    $financial->total_revenue = 112867000000;
    $financial->interest_income = 2127000000;
    $financial->save();
}

// 3. Update StockStatus
$status = App\Models\StockStatus::where('company_id', $company->id)->first();
if ($status) {
    $status->status = 'halal';
    $status->reason = 'Permissible core activity. Additionally, it passes all AAOIFI quantitative financial screening ratios.';
    $status->save();
}

// Clear Cache
Artisan::call('cache:clear');

echo "HONYFLOUR updated successfully!\n";
