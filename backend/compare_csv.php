<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;

$csvFile = '/Users/sinan/Desktop/stocks_financial_data.csv';
$handle = fopen($csvFile, 'r');
$header = fgetcsv($handle);

$discrepancies = [];
$missing = [];

while (($row = fgetcsv($handle)) !== false) {
    $data = array_combine($header, $row);
    $symbol = $data['Symbol'];
    
    $company = Company::where('symbol', $symbol)->first();
    if (!$company) {
        $missing[] = $symbol;
        continue;
    }
    
    $financials = $company->financials()->latest()->first();
    $aaoifi = $company->aaoifiScreening;
    
    $dbMarketCap = $company->market_cap ?? 0;
    // For legacy/missing financials, CSV might have 0 while DB has 0
    $dbAssets = $financials?->total_assets ?? 0;
    $dbDebt = $financials?->total_debt ?? 0;
    $dbCash = $financials?->cash_and_equivalents ?? 0;
    $dbInterestIncome = $financials?->interest_income ?? 0;
    $dbRevenue = $financials?->total_revenue ?? 0;
    
    $dbDebtRatio = $aaoifi?->debt_ratio ?? 0;
    $dbCashRatio = $aaoifi?->cash_ratio ?? 0;
    $dbImpureRatio = $aaoifi?->impermissible_income_ratio ?? 0;
    $dbFinalStatus = $aaoifi?->final_status ?? $company->current_status;
    
    $diffs = [];
    
    // Check raw values
    if (abs((float)$data['Total Assets'] - (float)$dbAssets) > 100) $diffs['Total Assets'] = ['csv' => $data['Total Assets'], 'db' => $dbAssets];
    if (abs((float)$data['Total Debt'] - (float)$dbDebt) > 100) $diffs['Total Debt'] = ['csv' => $data['Total Debt'], 'db' => $dbDebt];
    if (abs((float)$data['Cash'] - (float)$dbCash) > 100) $diffs['Cash'] = ['csv' => $data['Cash'], 'db' => $dbCash];
    if (abs((float)$data['Interest Income'] - (float)$dbInterestIncome) > 100) $diffs['Interest Income'] = ['csv' => $data['Interest Income'], 'db' => $dbInterestIncome];
    if (abs((float)$data['Total Revenue'] - (float)$dbRevenue) > 100) $diffs['Total Revenue'] = ['csv' => $data['Total Revenue'], 'db' => $dbRevenue];
    
    // Check AAOIFI ratios
    if (abs((float)$data['Debt Ratio'] - (float)$dbDebtRatio) > 0.01) $diffs['Debt Ratio'] = ['csv' => $data['Debt Ratio'], 'db' => $dbDebtRatio];
    if (abs((float)$data['Cash Ratio'] - (float)$dbCashRatio) > 0.01) $diffs['Cash Ratio'] = ['csv' => $data['Cash Ratio'], 'db' => $dbCashRatio];
    if (abs((float)$data['Impure Ratio'] - (float)$dbImpureRatio) > 0.01) $diffs['Impure Ratio'] = ['csv' => $data['Impure Ratio'], 'db' => $dbImpureRatio];
    
    // Check status
    if ($data['Final Status'] !== $dbFinalStatus) {
        $diffs['Final Status'] = ['csv' => $data['Final Status'], 'db' => $dbFinalStatus];
    }
    
    if (!empty($diffs)) {
        $discrepancies[$symbol] = $diffs;
    }
}
fclose($handle);

file_put_contents('csv_comparison_results.json', json_encode([
    'missing' => $missing,
    'discrepancies' => $discrepancies
], JSON_PRETTY_PRINT));

echo "Comparison complete! Written to csv_comparison_results.json\n";
