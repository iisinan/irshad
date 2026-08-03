<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$jsonPath = __DIR__.'/business_activity.json';
$data = json_decode(file_get_contents($jsonPath), true);

$missing = [];
$totalExcel = 0;
foreach($data as $row) {
    $symbol = trim(strtoupper($row['Ticker'] ?? ''));
    if (!$symbol) continue;
    $totalExcel++;
    
    $company = \App\Models\Company::where('symbol', $symbol)->first();
    if (!$company) {
        $missing[] = $symbol;
    }
}
echo "Total tickers in Excel: " . $totalExcel . "\n";
echo "Missing Companies: " . count($missing) . "\n";
echo implode(", ", $missing) . "\n";
