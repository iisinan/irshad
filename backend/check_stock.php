<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$company = \App\Models\Company::where('symbol', 'HONYFLOUR')->first();
$screening = $company->aaoifiScreening;

echo "Company current_status: " . $company->current_status . "\n";
echo "StockStatus status: " . ($company->status ? $company->status->status : 'null') . "\n";
echo "Screening final_status: " . $screening->final_status . "\n";
echo "Screening debt_status: " . $screening->debt_status . "\n";

