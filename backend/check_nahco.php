<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = \App\Models\Company::where('symbol', 'NAHCO')->first();
if($company) {
    $status = \App\Models\StockStatus::where('company_id', $company->id)->first();
    echo "NAHCO DB Status: " . ($status->status ?? 'None') . "\n";
    echo "NAHCO DB Reason: " . ($status->reason ?? 'None') . "\n";
}
