<?php
/**
 * update_from_yahoo.php
 * Reads yahoo_data.json produced by scripts/fetch_yahoo_data.py and updates
 * the companies table with prices, market_cap, pe_ratio, roe, overview, logo_url.
 * Run: php update_from_yahoo.php yahoo_data.json
 */
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use Illuminate\Support\Facades\Storage;

$jsonFile = $argv[1] ?? __DIR__ . '/yahoo_data.json';
if (!file_exists($jsonFile)) {
    echo "Error: $jsonFile not found.\n";
    exit(1);
}

$data = json_decode(file_get_contents($jsonFile), true);
if (!$data) {
    echo "Error: Failed to parse JSON.\n";
    exit(1);
}

$stats = [
    'price'      => 0,
    'market_cap' => 0,
    'pe_ratio'   => 0,
    'roe'        => 0,
    'overview'   => 0,
    'logo'       => 0,
    'skipped'    => 0,
];

foreach ($data as $symbol => $info) {
    if (!empty($info['error']) && $info['error'] === 'not_found') {
        $stats['skipped']++;
        continue;
    }

    $company = Company::where('symbol', $symbol)->first();
    if (!$company) {
        echo "  [SKIP] $symbol not in DB\n";
        continue;
    }

    $changed = false;

    // Price
    if (!empty($info['price']) && floatval($info['price']) > 0) {
        $company->latest_price = $info['price'];
        $changed = true;
        $stats['price']++;
    }

    // Market cap
    if (!empty($info['market_cap']) && floatval($info['market_cap']) > 0) {
        $company->market_cap = $info['market_cap'];
        $changed = true;
        $stats['market_cap']++;
    }

    // P/E ratio
    if (!empty($info['pe_ratio']) && is_numeric($info['pe_ratio'])) {
        $company->pe_ratio = round($info['pe_ratio'], 2);
        $changed = true;
        $stats['pe_ratio']++;
    }

    // ROE (Yahoo gives it as a decimal, e.g. 0.18 = 18%)
    if (!empty($info['roe']) && is_numeric($info['roe'])) {
        $company->roe = round($info['roe'] * 100, 2); // Store as percentage
        $changed = true;
        $stats['roe']++;
    }

    // Overview — only fill if empty
    if (empty($company->overview) && !empty($info['overview'])) {
        $company->overview = $info['overview'];
        $changed = true;
        $stats['overview']++;
    }

    // Logo — only fill if empty
    if (empty($company->logo_url) && !empty($info['logo_url'])) {
        $company->logo_url = $info['logo_url'];
        $changed = true;
        $stats['logo']++;
    }

    if ($changed) {
        $company->save();
        echo "  [OK] $symbol updated\n";
    }
}

echo "\n✅ Done!\n";
echo "  Prices updated:     {$stats['price']}\n";
echo "  Market caps updated:{$stats['market_cap']}\n";
echo "  P/E ratios saved:   {$stats['pe_ratio']}\n";
echo "  ROE saved:          {$stats['roe']}\n";
echo "  Overviews filled:   {$stats['overview']}\n";
echo "  Logos filled:       {$stats['logo']}\n";
echo "  Not found on Yahoo: {$stats['skipped']}\n";
