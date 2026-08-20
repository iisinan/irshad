<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
$company = Company::where('name', 'like', '%EUNISELL%')->orWhere('name', 'like', '%INTERLINK%')->first();
if ($company) {
    echo "Symbol: " . $company->symbol . " | Name: " . $company->name . "\n";
} else {
    echo "Not found.\n";
}
