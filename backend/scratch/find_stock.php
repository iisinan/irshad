<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = \App\Models\Company::where('market_cap', '>=', 17000000000)->where('market_cap', '<=', 18000000000)->first();
if ($company) {
    echo "Found in Company: " . $company->symbol . "\n";
} else {
    $md = \App\Models\MarketData::where('market_capitalisation', '>=', 17000000000)->where('market_capitalisation', '<=', 18000000000)->first();
    if ($md) echo "Found in MarketData: " . $md->ticker . "\n";
}
