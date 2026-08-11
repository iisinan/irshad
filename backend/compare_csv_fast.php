<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$csvFile = '/Users/sinan/Desktop/stocks_financial_data.csv';
$lines = file($csvFile);
$header = str_getcsv(array_shift($lines));

$discrepancies = [];

// Pre-fetch all companies with their screenings to avoid N+1 queries.
$companies = \App\Models\Company::with('aaoifiScreening')->get()->keyBy('symbol');

foreach ($lines as $line) {
    if (trim($line) === '') continue;
    $row = str_getcsv($line);
    
    $symbol = $row[0];
    $csvFinalStatus = strtolower(trim($row[3]));
    $csvMarketCap = (float) $row[5];
    $csvTotalAssets = (float) $row[6];
    $csvTotalDebt = (float) $row[7];
    $csvCash = (float) $row[8];
    $csvInterestIncome = (float) $row[9];
    $csvTotalRevenue = (float) $row[10];
    
    $csvDebtRatio = (float) $row[11];
    $csvCashRatio = (float) $row[12];
    $csvImpureRatio = (float) $row[13];
    
    $company = $companies->get($symbol);
    
    if (!$company) {
        $discrepancies[] = "- **{$symbol}**: Missing in database.";
        continue;
    }
    
    $screening = $company->aaoifiScreening;
    if (!$screening) {
        $discrepancies[] = "- **{$symbol}**: Missing screening data in database.";
        continue;
    }
    
    $dbFinalStatus = strtolower($company->current_status ?? $screening->final_status);
    $dbMarketCap = (float) $company->market_cap;
    $fd = is_array($screening->financial_data_used) ? $screening->financial_data_used : json_decode($screening->financial_data_used, true);
    $dbTotalAssets = (float) ($fd["total_assets"] ?? 0);
    $dbTotalDebt = (float) ($fd["total_debt"] ?? 0);
    $dbCash = (float) ($fd["cash"] ?? 0);
    $dbInterestIncome = (float) ($fd["interest_income"] ?? 0);
    $dbTotalRevenue = (float) ($fd["total_revenue"] ?? 0);
    
    $dbDebtRatio = $screening->debt_ratio !== null ? (float) $screening->debt_ratio : 0.0;
    $dbCashRatio = $screening->cash_ratio !== null ? (float) $screening->cash_ratio : 0.0;
    $dbImpureRatio = $screening->impermissible_income_ratio !== null ? (float) $screening->impermissible_income_ratio : 0.0;
    
    $diffs = [];
    
    if ($csvFinalStatus !== $dbFinalStatus) {
        $diffs[] = "Status (CSV: {$csvFinalStatus}, DB: {$dbFinalStatus})";
    }
    
    if (abs($csvMarketCap - $dbMarketCap) > 1.0) {
        $diffs[] = "Market Cap (CSV: {$csvMarketCap}, DB: {$dbMarketCap})";
    }
    
    if ($csvTotalAssets != 0 && abs($csvTotalAssets - $dbTotalAssets) > 1.0) {
        $diffs[] = "Total Assets (CSV: {$csvTotalAssets}, DB: {$dbTotalAssets})";
    }
    
    if ($csvTotalDebt != 0 && abs($csvTotalDebt - $dbTotalDebt) > 1.0) {
        $diffs[] = "Total Debt (CSV: {$csvTotalDebt}, DB: {$dbTotalDebt})";
    }
    
    if ($csvCash != 0 && abs($csvCash - $dbCash) > 1.0) {
        $diffs[] = "Cash (CSV: {$csvCash}, DB: {$dbCash})";
    }
    
    $csvDebtRatioPct = round($csvDebtRatio * 100, 4);
    $csvCashRatioPct = round($csvCashRatio * 100, 4);
    $csvImpureRatioPct = round($csvImpureRatio * 100, 4);
    
    $dbDebtRatioRound = round($dbDebtRatio, 4);
    $dbCashRatioRound = round($dbCashRatio, 4);
    $dbImpureRatioRound = round($dbImpureRatio, 4);
    
    if (abs($csvDebtRatioPct - $dbDebtRatioRound) > 0.1) {
        $diffs[] = "Debt Ratio (CSV: {$csvDebtRatioPct}%, DB: {$dbDebtRatioRound}%)";
    }
    if (abs($csvCashRatioPct - $dbCashRatioRound) > 0.1) {
        $diffs[] = "Cash Ratio (CSV: {$csvCashRatioPct}%, DB: {$dbCashRatioRound}%)";
    }
    if (abs($csvImpureRatioPct - $dbImpureRatioRound) > 0.1) {
        $diffs[] = "Impure Ratio (CSV: {$csvImpureRatioPct}%, DB: {$dbImpureRatioRound}%)";
    }
    
    if (!empty($diffs)) {
        $discrepancies[] = "- **{$symbol}**: " . implode(", ", $diffs);
    }
}

if (empty($discrepancies)) {
    echo "No discrepancies found!\n";
} else {
    echo count($discrepancies) . " discrepancies found:\n\n";
    echo implode("\n", $discrepancies) . "\n";
}
