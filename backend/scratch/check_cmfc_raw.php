<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$company = DB::table('companies')->where('symbol', 'CMFC')->first();

if ($company) {
    echo "Symbol: " . $company->symbol . "\n";
    echo "Current Status (Company): " . $company->current_status . "\n";
    
    $status = DB::table('stock_statuses')->where('company_id', $company->id)->first();
    if ($status) {
        echo "StockStatus Table Status: " . $status->status . "\n";
        echo "StockStatus Table Reason: " . $status->reason . "\n";
    }
    
    $screening = DB::table('aaoifi_screenings')->where('company_id', $company->id)->latest()->first();
    if ($screening) {
        echo "AAOIFI Screening Table Status: " . $screening->final_status . "\n";
        echo "AAOIFI Screening Business Status: " . $screening->business_status . "\n";
        echo "AAOIFI Screening Business Reasoning: " . $screening->business_reasoning . "\n";
    }
} else {
    echo "CMFC not found.\n";
}
