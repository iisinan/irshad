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
    
    $csvMarketCap = (float) $row[5];
    $csvTotalAssets = (float) $row[6];
    $csvTotalDebt = (float) $row[7];
    $csvCash = (float) $row[8];
    $csvInterestIncome = (float) $row[9];
    $csvTotalRevenue = (float) $row[10];
    
    $company = $companies->get($symbol);
    
    if (!$company) {
        continue;
    }
    
    $company->market_cap = $csvMarketCap;
    $company->save();
    
    $screening = $company->aaoifiScreening;
    if ($screening) {
        $fd = is_array($screening->financial_data_used) ? $screening->financial_data_used : json_decode($screening->financial_data_used, true);
        
        $fd['market_cap'] = $csvMarketCap;
        $fd['total_assets'] = $csvTotalAssets;
        $fd['total_debt'] = $csvTotalDebt;
        $fd['cash'] = $csvCash;
        $fd['interest_income'] = $csvInterestIncome;
        $fd['total_revenue'] = $csvTotalRevenue;
        
        $screening->financial_data_used = $fd;
        $screening->save();
        $updatedCount++;
    }
}

echo "Successfully synced data from CSV to DB for {$updatedCount} companies.\n";
