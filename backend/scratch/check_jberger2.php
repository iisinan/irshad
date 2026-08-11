<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = App\Models\Company::where('symbol', 'JBERGER')->with('aaoifiScreening', 'status')->first();
if ($c) {
    echo "Status: " . $c->current_status . "\n";
    $aaoifi = $c->aaoifiScreening;
    if ($aaoifi) {
        echo "Business Status: " . $aaoifi->business_status . "\n";
        echo "Business Reasoning: " . json_encode($aaoifi->business_reasoning) . "\n";
        echo "Debt Ratio: " . $aaoifi->debt_ratio . "\n";
        echo "Cash Ratio: " . $aaoifi->cash_ratio . "\n";
        echo "Impermissible Income Ratio: " . $aaoifi->impermissible_income_ratio . "\n";
        $fin = is_string($aaoifi->financial_data_used) ? json_decode($aaoifi->financial_data_used, true) : $aaoifi->financial_data_used;
        echo "Financial Data:\n";
        print_r($fin);
    }
}
