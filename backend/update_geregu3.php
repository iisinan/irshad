<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'GEREGU')->first();
$financial = App\Models\Financial::where('company_id', $company->id)->latest()->first();

if ($financial) {
    // Update with correct 6-month figures
    $financial->total_assets = 243622903000;
    $financial->cash_and_equivalents = 65588679000;
    $financial->total_debt = 66094839000;
    $financial->total_revenue = 137126532000;
    $financial->interest_income = 2696283000;
    $financial->save();
    
    echo "Updated App\Models\Financial for GEREGU.\n";
} else {
    echo "No Financial record found.\n";
}

// Ensure cache is cleared
Artisan::call('cache:clear');
echo "Cleared cache.\n";
