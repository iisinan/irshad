<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$companies = Company::withCount('financials')->get();
$total = $companies->count();

$stats = [
    'logos' => 0,
    'overviews' => 0,
    'sectors' => 0,
    'prices' => 0,
    'financials' => 0,
];

foreach($companies as $c) {
    if (!empty($c->logo_url)) $stats['logos']++;
    if (!empty($c->overview)) $stats['overviews']++;
    if (!empty($c->sector) && $c->sector !== 'Unknown') $stats['sectors']++;
    if ($c->latest_price > 0) $stats['prices']++;
    if ($c->financials_count > 0) $stats['financials']++;
}

echo "Total Companies: $total\n";
echo "--------------------------\n";
foreach ($stats as $key => $count) {
    $missing = $total - $count;
    $pct = round(($count / $total) * 100, 1);
    echo str_pad($key, 20) . " | Has: " . str_pad($count, 3) . " ($pct%) | Missing: $missing\n";
}
