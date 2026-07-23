<?php
/**
 * fill_overviews_from_json.php
 * Reads gemini_overviews.json and saves overviews for companies that still have none.
 * Run: php fill_overviews_from_json.php gemini_overviews.json
 */
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;

$jsonFile = $argv[1] ?? __DIR__ . '/gemini_overviews.json';
if (!file_exists($jsonFile)) {
    echo "Error: $jsonFile not found.\n";
    exit(1);
}

$overviews = json_decode(file_get_contents($jsonFile), true);
$updated = 0;

foreach ($overviews as $symbol => $overview) {
    $company = Company::where('symbol', $symbol)->first();
    if (!$company) continue;
    if (!empty($company->overview)) continue; // Already has one

    $company->overview = $overview;
    $company->save();
    echo "  [OK] $symbol overview saved\n";
    $updated++;
}

echo "\n✅ Done! Saved overviews for $updated companies.\n";
