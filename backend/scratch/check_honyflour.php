<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'HONYFLOUR')->with('aaoifiScreening')->first();
if ($company) {
    echo "HONYFLOUR Status: " . $company->current_status . "\n";
    $aaoifi = $company->aaoifiScreening;
    if ($aaoifi) {
        echo "Debt Ratio: " . $aaoifi->debt_ratio . "\n";
        echo "Cash Ratio: " . $aaoifi->cash_ratio . "\n";
        echo "Impermissible Income Ratio: " . $aaoifi->impermissible_income_ratio . "\n";
        
        $fin = is_string($aaoifi->financial_data_used) ? json_decode($aaoifi->financial_data_used, true) : $aaoifi->financial_data_used;
        echo "\nFinancial Data:\n";
        print_r($fin);
    }
}
