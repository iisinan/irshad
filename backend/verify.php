<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$symbol = 'ARADEL';
$company = \App\Models\Company::where('symbol', $symbol)->first();
$screening = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();
echo "Data for $symbol:\n";
echo "Debt: " . $screening->debt_ratio . "\n";
echo "Cash: " . $screening->cash_ratio . "\n";
echo "Imp Inc: " . $screening->impermissible_income_ratio . "\n";
echo "Fin Data Used: " . $screening->financial_data_used . "\n";
echo "Status: " . $screening->final_status . "\n";
