<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use Illuminate\Support\Facades\DB;

$company = Company::with('aaoifiScreening')->where('symbol', 'NAHCO')->first();
$status = \App\Models\StockStatus::where('company_id', $company->id)->first();
echo "Stock Status Reason: " . $status->reason . "\n";
echo "Business Reasoning: " . $company->aaoifiScreening->business_reasoning . "\n";
