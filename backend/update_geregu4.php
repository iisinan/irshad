<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'GEREGU')->first();
$status = App\Models\StockStatus::where('company_id', $company->id)->first();

if ($status) {
    $status->status = 'halal';
    $status->reason = 'Passes both qualitative business and quantitative financial Shariah compliance checks.';
    $status->save();
    
    echo "Updated StockStatus for GEREGU.\n";
} else {
    echo "No StockStatus record found.\n";
}

// Ensure cache is cleared
Artisan::call('cache:clear');
echo "Cleared cache.\n";
