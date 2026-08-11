<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\StockStatus;

$company = Company::where('symbol', 'NAHCO')->first();
$status = StockStatus::where('company_id', $company->id)->first();
echo json_encode($status->toArray(), JSON_PRETTY_PRINT);
