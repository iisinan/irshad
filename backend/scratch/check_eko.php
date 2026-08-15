<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = \App\Models\Company::where('symbol', 'EKOCORP')->first();
if ($company) {
    $screening = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    echo "AAOIFI Screening Table:\n";
    echo "Business Reasoning: " . $screening->business_reasoning . "\n";
    $status = \App\Models\StockStatus::where('company_id', $company->id)->first();
    echo "StockStatus Reason: " . ($status->reason ?? 'null') . "\n";
} else {
    echo "EKOCORP not found.\n";
}
