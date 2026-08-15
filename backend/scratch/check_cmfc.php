<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$cmfc = Company::with(['aaoifiScreenings', 'stockStatus'])->where('symbol', 'CMFC')->first();

if ($cmfc) {
    echo "Symbol: " . $cmfc->symbol . "\n";
    echo "Current Status (Company): " . $cmfc->current_status . "\n";
    if ($cmfc->stockStatus) {
        echo "StockStatus Table Status: " . $cmfc->stockStatus->status . "\n";
        echo "StockStatus Table Reason: " . $cmfc->stockStatus->reason . "\n";
    }
} else {
    echo "CMFC not found.\n";
}
