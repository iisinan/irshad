<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$company = \App\Models\Company::where('symbol', 'HONYFLOUR')->first();
$screening = $company->aaoifiScreening;
print_r($screening->financial_data_used);
