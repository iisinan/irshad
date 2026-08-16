<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$company = Company::where('name', 'like', '%AUSTIN LAZ%')->orWhere('symbol', 'like', '%AUSTIN%')->first();

if ($company) {
    echo "Symbol: " . $company->symbol . "\n";
    echo "Name: " . $company->name . "\n";
} else {
    echo "Not found.\n";
}
