<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
$company = Company::where('symbol', 'NAHCO')->first();
echo "NAHCO Has Purification: " . ($company->impure_income_ratio > 0 ? "Yes, " . $company->impure_income_ratio . "%" : "No") . "\n";
