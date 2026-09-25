<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('name', 'like', '%Dangote Petroleum%')->orWhere('symbol', 'DPRP')->first();
if ($company) {
    echo "Found: " . $company->symbol . "\n";
    $company->delete();
    echo "Deleted.\n";
} else {
    echo "Not found.\n";
}
