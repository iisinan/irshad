<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$total = \App\Models\Company::count();
$withMarketCap = \App\Models\Company::whereNotNull('market_cap')->count();
$withPeRatio = \App\Models\Company::whereNotNull('pe_ratio')->count();
$withOverview = \App\Models\Company::whereNotNull('overview')->count();
$withLogo = \App\Models\Company::whereNotNull('logo_url')->count();
$withFinancials = \App\Models\Company::whereHas('financials')->count();
$withPrices = \App\Models\Company::whereHas('dailyPrices')->count();
$withStatus = \App\Models\Company::whereNotNull('current_status')->count();

echo json_encode([
    'Total Companies' => $total,
    'Has Market Cap' => $withMarketCap,
    'Has PE Ratio' => $withPeRatio,
    'Has Overview' => $withOverview,
    'Has Logo' => $withLogo,
    'Has Financials (AAOIFI Breakdown)' => $withFinancials,
    'Has Daily Prices (Chart)' => $withPrices,
    'Has AAOIFI Status' => $withStatus
], JSON_PRETTY_PRINT) . "\n";
