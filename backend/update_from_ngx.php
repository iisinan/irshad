<?php
/**
 * update_from_ngx.php
 * Reads ngx_data.json (from fetch_ngx_data.py) and updates
 * companies with: latest_price, market_cap, logo_url
 * Run: php update_from_ngx.php ngx_data.json
 */
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;

$jsonFile = $argv[1] ?? __DIR__ . '/ngx_data.json';
if (!file_exists($jsonFile)) { echo "Error: $jsonFile not found.\n"; exit(1); }

$data = json_decode(file_get_contents($jsonFile), true);
if (!$data) { echo "Error: Failed to parse JSON.\n"; exit(1); }

$priceUpdated = 0; $mcapUpdated = 0; $logoUpdated = 0; $skipped = 0;

foreach ($data as $symbol => $info) {
    if (!empty($info['error'])) { $skipped++; continue; }

    $company = Company::where('symbol', $symbol)->first();
    if (!$company) { echo "  [SKIP] $symbol not in DB\n"; continue; }

    $changed = false;

    if (!empty($info['price']) && floatval($info['price']) > 0) {
        $company->latest_price = $info['price'];
        $changed = true; $priceUpdated++;
    }
    if (!empty($info['market_cap']) && floatval($info['market_cap']) > 0) {
        $company->market_cap = $info['market_cap'];
        $changed = true; $mcapUpdated++;
    }
    if (empty($company->logo_url) && !empty($info['logo_url'])) {
        $company->logo_url = $info['logo_url'];
        $changed = true; $logoUpdated++;
    }

    if ($changed) { $company->save(); echo "  [OK] $symbol\n"; }
}

echo "\n✅ Done!\n";
echo "  Prices updated:      $priceUpdated\n";
echo "  Market caps updated: $mcapUpdated\n";
echo "  Logos filled:        $logoUpdated\n";
echo "  Not found / skipped: $skipped\n";
