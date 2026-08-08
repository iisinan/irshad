<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'JAIZBANK')->first();
$status = App\Models\StockStatus::where('company_id', $company->id)->first();
if ($status) {
    $status->status = 'halal';
    $status->reason = 'Screened in accordance with AAOIFI Shariah Standard No. 21. (Islamic Bank Exemption)';
    $status->save();
    echo "Updated StockStatus for JAIZBANK to halal\n";
}
