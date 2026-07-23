<?php
/**
 * export_ticker_list.php
 * Exports all company symbols to a text file for use with Python scripts.
 * Also exports companies missing overview to JSON for Gemini fallback.
 */
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;

$companies = Company::all(['symbol', 'name', 'sector', 'overview']);

// Export all ticker symbols (one per line)
$tickerFile = __DIR__ . '/all_tickers.txt';
file_put_contents($tickerFile, $companies->pluck('symbol')->implode("\n"));
echo "Exported " . $companies->count() . " tickers to all_tickers.txt\n";

// Export companies missing overview to JSON for Gemini fallback
$missingOverview = $companies->filter(fn($c) => empty($c->overview))
    ->mapWithKeys(fn($c) => [$c->symbol => ['name' => $c->name, 'sector' => $c->sector ?? 'General']])
    ->toArray();

$overviewFile = __DIR__ . '/missing_overviews.json';
file_put_contents($overviewFile, json_encode($missingOverview, JSON_PRETTY_PRINT));
echo "Exported " . count($missingOverview) . " companies needing overviews to missing_overviews.json\n";
