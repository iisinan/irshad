<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = \App\Models\Company::with('financials', 'dailyPrices', 'aaoifiScreening')->where('symbol', 'JAIZBANK')->first();
echo json_encode($company);
