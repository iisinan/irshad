<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = \App\Models\Company::with('marketData')->where('symbol', 'AIRTELAFRI')->first();
echo json_encode([
    'company_market_cap' => $company->market_cap,
    'market_data_market_capitalisation' => $company->marketData->market_capitalisation ?? null,
    'company_open_price' => $company->open_price ?? null,
    'market_data_open_price' => $company->marketData->open_price ?? null,
    'market_data' => $company->marketData->toArray(),
], JSON_PRETTY_PRINT);
