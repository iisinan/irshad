<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'LEGENDINT')->first();
if (!$company) {
    echo "LEGENDINT not found.\n";
    exit;
}

// 1. Update AaoifiScreening
$aaoifi = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
if (!$aaoifi) {
    $aaoifi = new App\Models\AaoifiScreening();
    $aaoifi->company_id = $company->id;
}

$aaoifi->debt_ratio = 7.45;
$aaoifi->debt_status = 'pass';
$aaoifi->cash_ratio = 3.20;
$aaoifi->cash_status = 'pass';
$aaoifi->impermissible_income_ratio = 0;
$aaoifi->impermissible_income_status = 'pass';

$aaoifi->business_status = 'pass';
$aaoifi->business_reasoning = json_encode(['justification' => 'Permissible core activity.']);
$aaoifi->final_status = 'halal';
$aaoifi->save();

// 2. Update Financial
$financial = App\Models\Financial::where('company_id', $company->id)->latest()->first();
if ($financial) {
    $financial->total_assets = 3453216000;
    $financial->cash_and_equivalents = 269126000;
    $financial->total_debt = 625899000;
    $financial->total_revenue = 505360000;
    $financial->interest_income = 0;
    $financial->save();
} else {
    $financial = new App\Models\Financial();
    $financial->company_id = $company->id;
    $financial->total_assets = 3453216000;
    $financial->cash_and_equivalents = 269126000;
    $financial->total_debt = 625899000;
    $financial->total_revenue = 505360000;
    $financial->interest_income = 0;
    $financial->reporting_period = 'Q2';
    $financial->save();
}

// 3. Update StockStatus
$status = App\Models\StockStatus::where('company_id', $company->id)->first();
if ($status) {
    $status->status = 'halal';
    $status->reason = 'Permissible core activity.';
    $status->save();
} else {
    $status = new App\Models\StockStatus();
    $status->company_id = $company->id;
    $status->status = 'halal';
    $status->reason = 'Permissible core activity.';
    $status->save();
}

// Clear Cache
Artisan::call('cache:clear');

echo "LEGENDINT updated successfully!\n";
