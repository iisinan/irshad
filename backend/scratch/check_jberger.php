<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'like', '%BERGER%')->with('aaoifiScreening')->get();
foreach ($company as $c) {
    echo "Company: " . $c->name . " (" . $c->symbol . ")\n";
    echo "Status: " . $c->current_status . "\n";
    $aaoifi = $c->aaoifiScreening;
    if ($aaoifi) {
        echo "Business Status: " . $aaoifi->business_status . "\n";
        echo "Business Reasoning: " . $aaoifi->business_reasoning . "\n";
        echo "Debt Ratio: " . $aaoifi->debt_ratio . "\n";
        echo "Cash Ratio: " . $aaoifi->cash_ratio . "\n";
        echo "Impermissible Income Ratio: " . $aaoifi->impermissible_income_ratio . "\n";
        $fin = is_string($aaoifi->financial_data_used) ? json_decode($aaoifi->financial_data_used, true) : $aaoifi->financial_data_used;
        echo "Financial Data:\n";
        print_r($fin);
    }
    echo "--------------------------\n";
}
