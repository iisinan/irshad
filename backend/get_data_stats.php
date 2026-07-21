<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

$companies = \App\Models\Company::all();
$total = $companies->count();

$stats = [
    'logos' => 0,
    'overviews' => 0,
    'sectors' => 0,
    'prices' => 0,
    'market_cap' => 0,
    'pe_ratio' => 0,
    'div_yield' => 0,
    'roe' => 0,
    'financials_aaoifi' => 0,
];

foreach ($companies as $c) {
    if (!empty($c->logo_url)) $stats['logos']++;
    if (!empty($c->overview)) $stats['overviews']++;
    if (!empty($c->sector) && $c->sector !== 'Unknown') $stats['sectors']++;
    if ($c->latest_price > 0) $stats['prices']++;
    if ($c->market_cap > 0) $stats['market_cap']++;
    if (!empty($c->pe_ratio)) $stats['pe_ratio']++;
    if (!empty($c->div_yield)) $stats['div_yield']++;
    if (!empty($c->roe)) $stats['roe']++;
    if ($c->financials()->count() > 0) $stats['financials_aaoifi']++;
}

echo "Total Companies: $total\n";
echo "--------------------------\n";
foreach ($stats as $key => $count) {
    $missing = $total - $count;
    $pct = round(($count / $total) * 100, 1);
    echo str_pad($key, 20) . " | Has: " . str_pad($count, 3) . " ($pct%) | Missing: $missing\n";
}
