<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'JOHNHOLT')->first();
if (!$company) {
    echo "JOHNHOLT not found.\n";
    exit;
}

// 1. Update AaoifiScreening
$aaoifi = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
if ($aaoifi) {
    // Only "Permissible core activity." for business_reasoning
    $aaoifi->business_reasoning = json_encode(['justification' => 'Permissible core activity.']);
    $aaoifi->save();
}

// 3. Update StockStatus
$status = App\Models\StockStatus::where('company_id', $company->id)->first();
if ($status) {
    $status->reason = 'Permissible core activity.';
    $status->save();
}

// Clear Cache
Artisan::call('cache:clear');

echo "JOHNHOLT updated successfully!\n";
