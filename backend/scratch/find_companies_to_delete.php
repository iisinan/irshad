<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$stocksMd = file_get_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/ngx_stocks.md');
$etfsMd = file_get_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/ngx_etfs.md');

$validSymbols = [];

// Extract from ngx_stocks.md
// Format: | 1 | **ABBEYBANK** | https://...
preg_match_all('/\|\s*\d+\s*\|\s*\*\*([^\*]+)\*\*/', $stocksMd, $matches);
foreach ($matches[1] as $symbol) {
    $validSymbols[] = trim($symbol);
}

// Extract from ngx_etfs.md
// Format: | **NEWGOLD** | ...
preg_match_all('/\|\s*\*\*([^\*]+)\*\*\s*\|/', $etfsMd, $matches);
foreach ($matches[1] as $symbol) {
    $validSymbols[] = trim($symbol);
}

$validSymbols = array_unique($validSymbols);

$dbCompanies = Company::pluck('symbol')->toArray();

$toDelete = array_diff($dbCompanies, $validSymbols);

echo "Total Valid Symbols found in markdown files: " . count($validSymbols) . "\n";
echo "Total Companies in DB: " . count($dbCompanies) . "\n";
echo "Companies to DELETE: " . count($toDelete) . "\n";
echo "List to DELETE: \n";
echo implode(", ", $toDelete) . "\n";
