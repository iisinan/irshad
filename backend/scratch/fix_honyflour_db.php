<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'HONYFLOUR')->with('aaoifiScreening')->first();
if ($company) {
    $aaoifi = $company->aaoifiScreening;
    if ($aaoifi) {
        if ($aaoifi->debt_ratio < 1) {
            $aaoifi->debt_ratio = $aaoifi->debt_ratio * 100;
        }
        if ($aaoifi->cash_ratio < 1) {
            $aaoifi->cash_ratio = $aaoifi->cash_ratio * 100;
        }
        $aaoifi->save();
        echo "Fixed HONYFLOUR ratios! Debt is now: " . $aaoifi->debt_ratio . " and Cash is: " . $aaoifi->cash_ratio . "\n";
    }

    $status = App\Models\StockStatus::where('company_id', $company->id)->first();
    if ($status) {
        $status->reason = "Permissible core activity. However, it marginally fails the AAOIFI quantitative financial screening for debt (30.07% vs 30.00% limit).";
        $status->save();
        echo "Updated Status Reason.\n";
    }
}
