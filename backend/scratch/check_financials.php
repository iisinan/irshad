<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$mismatchedTickers = [
    'ABCTRANS', 'AIRTELAFRI', 'BAPLC', 'BERGER', 'CAVERTON', 'CHAMS', 'CONOIL',
    'DANGSUGAR', 'ETERNA', 'ETRANZACT', 'GEREGU', 'HONYFLOUR', 'JBERGER', 'MAYBAKER',
    'MEYER', 'MORISON', 'MULTIVERSE', 'NASCON', 'NNFM', 'OANDO', 'RTBRISCOE',
    'TOTAL', 'UACN', 'UNILEVER', 'UNIONDICON', 'UPL', 'VITAFOAM', 'NAHCO' // Excluded SCOA since it's business status
];

$companies = Company::whereIn('symbol', $mismatchedTickers)
    ->with('aaoifiScreening')
    ->get();

echo "FINANCIAL DATA CHECK FOR MISMATCHED STOCKS\n";
echo str_repeat("=", 120) . "\n\n";

$formatAmount = function($val) {
    if ($val === null || $val === "") return "MISSING";
    return is_numeric($val) ? number_format((float)$val, 0) : $val;
};

$formatRatio = function($val) {
    if ($val === null || $val === "") return "N/A";
    return is_numeric($val) ? number_format((float)$val, 2) . "%" : $val;
};

foreach ($companies as $company) {
    $aaoifi = $company->aaoifiScreening;
    if (!$aaoifi) continue;
    
    $finData = $aaoifi->financial_data_used ?? [];
    if (is_string($finData)) {
        $finData = json_decode($finData, true);
    }
    
    echo "Ticker: " . $company->symbol . "\n";
    echo "DB Final Status: " . ($company->current_status ?? 'null') . "\n";
    echo "AAOIFI Final Status: " . $aaoifi->final_status . "\n";
    
    // Ratios
    echo "Ratios:\n";
    echo "  - Debt Ratio (Limit 30%): " . $formatRatio($aaoifi->debt_ratio) . " [Status: {$aaoifi->debt_status}]\n";
    echo "  - Cash Ratio (Limit 30%): " . $formatRatio($aaoifi->cash_ratio) . " [Status: {$aaoifi->cash_status}]\n";
    echo "  - Imp. Income Ratio (Limit 5%): " . $formatRatio($aaoifi->impermissible_income_ratio) . " [Status: {$aaoifi->impermissible_income_status}]\n";
    
    // Raw Financials
    echo "Raw Financials:\n";
    echo "  - Market Cap: " . $formatAmount($finData['market_cap'] ?? null) . "\n";
    echo "  - Total Assets: " . $formatAmount($finData['total_assets'] ?? null) . "\n";
    echo "  - Total Debt: " . $formatAmount($finData['total_debt'] ?? null) . "\n";
    echo "  - Cash: " . $formatAmount($finData['cash'] ?? null) . "\n";
    echo "  - Interest Bearing Sec: " . $formatAmount($finData['interest_bearing_securities'] ?? null) . "\n";
    echo "  - Interest Income: " . $formatAmount($finData['interest_income'] ?? null) . "\n";
    echo "  - Total Revenue: " . $formatAmount($finData['total_revenue'] ?? null) . "\n";
    
    // Determine the likely denominator (Market Cap is preferred in AAOIFI, else Total Assets)
    $denominator = $finData['market_cap'] ?? null;
    if (empty($denominator) || $denominator == 0) {
        $denominator = $finData['total_assets'] ?? null;
    }
    
    if (empty($denominator) || $denominator == 0) {
        echo "⚠️  WARNING: Missing Market Cap and Total Assets (Denominator is zero/missing)\n";
    }
    
    if (empty($finData['total_debt']) && !is_numeric($finData['total_debt'])) {
        echo "⚠️  WARNING: Total Debt is missing\n";
    }
    
    echo str_repeat("-", 120) . "\n";
}
