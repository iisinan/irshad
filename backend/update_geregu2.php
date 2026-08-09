<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'GEREGU')->first();
$aaoifi = App\Models\AaoifiScreening::where('company_id', $company->id)->first();

$finData = $aaoifi->financial_data_used;
if (is_string($finData)) {
    $finData = json_decode($finData, true);
}

// Update with correct 6-month figures
$finData['total_assets'] = 243622903000;
$finData['cash'] = 65588679000;
$finData['total_debt'] = 66094839000;
$finData['total_revenue'] = 137126532000;
$finData['interest_income'] = 2696283000;

$aaoifi->financial_data_used = $finData;
$aaoifi->save();

// We must also clear the cache, since the controller caches the result
Cache::tags(['stocks'])->flush();

echo "Updated financial data and cleared cache!\n";
