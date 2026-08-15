<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$doubtfulCompanies = Company::where('current_status', 'doubtful')->orderBy('symbol')->get();

echo "Count: " . $doubtfulCompanies->count() . "\n";
foreach ($doubtfulCompanies as $company) {
    echo "- " . $company->symbol . " (" . $company->name . ")\n";
}
