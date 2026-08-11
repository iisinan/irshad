<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$csvFile = '/Users/sinan/Desktop/stocks_financial_data.csv';
$lines = file($csvFile);
$header = str_getcsv(array_shift($lines));

$companies = \App\Models\Company::with('aaoifiScreening')->get()->keyBy('symbol');
$updatedCount = 0;

foreach ($lines as $line) {
    if (trim($line) === '') continue;
    $row = str_getcsv($line);
    
    $symbol = $row[0];
    
    $csvDebtRatio = (float) $row[11] * 100;
    $csvCashRatio = (float) $row[12] * 100;
    $csvImpureRatio = (float) $row[13] * 100;
    
    $company = $companies->get($symbol);
    
    if (!$company) {
        continue;
    }
    
    $screening = $company->aaoifiScreening;
    if ($screening) {
        $screening->debt_ratio = $csvDebtRatio;
        $screening->cash_ratio = $csvCashRatio;
        $screening->impermissible_income_ratio = $csvImpureRatio;
        
        $screening->save();
        $updatedCount++;
    }
}

echo "Successfully synced ratios from CSV to DB for {$updatedCount} companies.\n";
