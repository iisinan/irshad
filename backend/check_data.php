<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$total = App\Models\Company::count();
$withData = App\Models\Company::has('financials')->count();
$missing = $total - $withData;
$missingCompanies = App\Models\Company::doesntHave('financials')->pluck('symbol')->toArray();

echo "Total Companies: $total\n";
echo "Successfully Extracted: $withData\n";
echo "Missing Data: $missing\n";

if ($missing > 0 && $missing <= 150) {
    echo "Missing symbols: " . implode(', ', $missingCompanies) . "\n";
} elseif ($missing > 150) {
    echo "First 150 missing: " . implode(', ', array_slice($missingCompanies, 0, 150)) . "\n";
}
