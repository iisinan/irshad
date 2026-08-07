<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$stocksMd = file_get_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/ngx_stocks.md');
$etfsMd = file_get_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/ngx_etfs.md');

$validSymbols = [];

preg_match_all('/\|\s*\d+\s*\|\s*\*\*([^\*]+)\*\*/', $stocksMd, $matches);
foreach ($matches[1] as $symbol) {
    $validSymbols[] = trim($symbol);
}

preg_match_all('/\|\s*\*\*([^\*]+)\*\*\s*\|/', $etfsMd, $matches);
foreach ($matches[1] as $symbol) {
    $validSymbols[] = trim($symbol);
}

$validSymbols = array_unique($validSymbols);

$companies = Company::all();
$count = 0;

foreach ($companies as $company) {
    if (!in_array($company->symbol, $validSymbols)) {
        echo "Deleting: " . $company->symbol . "\n";
        $company->delete();
        $count++;
    }
}

echo "\nSuccessfully deleted $count companies.\n";
