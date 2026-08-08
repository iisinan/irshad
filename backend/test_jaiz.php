<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'JAIZBANK')->first();
if (!$company) {
    echo "Company not found\n";
    exit;
}
$financials = $company->financials()->first();
echo json_encode($financials, JSON_PRETTY_PRINT);
