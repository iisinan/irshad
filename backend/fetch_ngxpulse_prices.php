<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;
use App\Models\Company;

echo "Fetching data from NGX Pulse...\n";

$response = Http::withHeaders([
    'Referer' => 'https://ngxpulse.ng/'
])->get('https://ngxpulse.ng/api/ngxdata/stocks');

if (!$response->successful()) {
    echo "Failed to fetch from NGX Pulse: " . $response->status() . "\n";
    exit(1);
}

$data = $response->json();
$stocks = $data['stocks'] ?? [];

if (empty($stocks)) {
    echo "No stocks found in response.\n";
    exit(1);
}

echo "Found " . count($stocks) . " stocks on NGX Pulse.\n";

$updatedPrices = 0;
$updatedSectors = 0;

foreach ($stocks as $stock) {
    $symbol = trim($stock['symbol']);
    $company = Company::where('symbol', $symbol)->first();
    
    if ($company) {
        $changed = false;
        
        // Update price
        if (isset($stock['current_price']) && is_numeric($stock['current_price'])) {
            $company->latest_price = $stock['current_price'];
            
            // Also update price change and pct if available
            if (isset($stock['change_percent'])) {
                $company->price_change_pct = $stock['change_percent'];
            }
            if (isset($stock['current_price']) && isset($stock['previous_close'])) {
                $company->price_change = $stock['current_price'] - $stock['previous_close'];
            }
            
            $changed = true;
            $updatedPrices++;
        }
        
        // Update market cap
        if (isset($stock['market_cap']) && is_numeric($stock['market_cap'])) {
            $company->market_cap = $stock['market_cap'];
            $changed = true;
        }
        
        // Update sector if missing
        if (isset($stock['sector']) && !empty($stock['sector']) && (empty($company->sector) || $company->sector === 'Unknown')) {
            $company->sector = trim($stock['sector']);
            $changed = true;
            $updatedSectors++;
        }
        
        if ($changed) {
            $company->save();
        }
    }
}

echo "Done! Updated {$updatedPrices} prices and {$updatedSectors} missing sectors.\n";
