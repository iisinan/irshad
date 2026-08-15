<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
$company = Company::where('symbol', 'TOTAL')->first();
echo json_encode($company->aaoifiScreening->toArray(), JSON_PRETTY_PRINT);
