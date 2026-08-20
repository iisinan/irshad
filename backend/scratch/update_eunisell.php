<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

// Values in Naira as strings for BCMath
$total_assets = '1470784000'; 
$total_debt = '84823000';
$cash = '15688000';
$total_revenue = '1836917000';
$interest_income = '0';

$company = Company::where('symbol', 'EUNISELL')->first();

if (!$company) {
    echo "EUNISELL not found!\n";
    exit;
}

$market_cap = (string) ($company->market_cap ?: $total_assets);

// Calculate Denominator using BCMath (greater of market_cap or total_assets)
$denominator = bccomp($market_cap, $total_assets, 4) === 1 ? $market_cap : $total_assets;

// BCMath calculations with high scale (e.g., 6 decimal places)
// Debt Ratio = (Total Debt / Denominator) * 100
$debt_ratio_raw = bcdiv($total_debt, $denominator, 6);
$debt_ratio = bcmul($debt_ratio_raw, '100', 4);

// Cash Ratio = (Cash / Denominator) * 100
$cash_ratio_raw = bcdiv($cash, $denominator, 6);
$cash_ratio = bcmul($cash_ratio_raw, '100', 4);

// Impure Income Ratio = (Interest Income / Total Revenue) * 100
$impure_ratio = '0.0000';
if (bccomp($total_revenue, '0', 4) === 1) {
    $impure_ratio_raw = bcdiv($interest_income, $total_revenue, 6);
    $impure_ratio = bcmul($impure_ratio_raw, '100', 4);
}

// Check thresholds using BCMath
$debt_pass = bccomp($debt_ratio, '30.0000', 4) <= 0;
$cash_pass = bccomp($cash_ratio, '30.0000', 4) <= 0;
$impure_pass = bccomp($impure_ratio, '5.0000', 4) <= 0;

$financial_status = ($debt_pass && $cash_pass && $impure_pass) ? 'pass' : 'fail';

$screening = AaoifiScreening::where('company_id', $company->id)->latest()->first();
if ($screening) {
    $screening->update([
        'debt_ratio' => (float) $debt_ratio,
        'cash_ratio' => (float) $cash_ratio,
        'impermissible_income_ratio' => (float) $impure_ratio,
        'financial_status' => $financial_status,
        'financial_data_used' => [
            'total_assets' => (float) $total_assets,
            'total_debt' => (float) $total_debt,
            'cash_and_equivalents' => (float) $cash,
            'total_revenue' => (float) $total_revenue,
            'interest_income' => (float) $interest_income,
            'market_cap' => (float) $market_cap
        ],
        'denominator_used' => bccomp($market_cap, $total_assets, 4) === 1 ? 'Market Cap' : 'Total Assets',
        'evidence_link' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/47595_EUNISELL_INTERLINKED_PLC-_YEAR_END_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_JULY_2026.pdf'
    ]);
    
    // Now recalculate final status
    $final_status = 'non-compliant';
    if (strtolower($screening->business_status) === 'pass' && $financial_status === 'pass') {
        $final_status = 'halal';
    } elseif (strtolower($screening->business_status) === 'doubtful' || $financial_status === 'doubtful') {
        $final_status = 'doubtful';
    }
    
    $screening->update(['final_status' => $final_status]);
    $company->update(['current_status' => $final_status]);
    
    // Also update stock_statuses table
    \Illuminate\Support\Facades\DB::table('stock_statuses')->updateOrInsert(
        ['company_id' => $company->id],
        [
            'status' => $final_status,
            'reason' => 'Updated via Jun 2026 financials.'
        ]
    );
    
    echo "Successfully updated EUNISELL.\n";
    echo "Debt Ratio: " . $debt_ratio . "%\n";
    echo "Cash Ratio: " . $cash_ratio . "%\n";
    echo "Impure Income Ratio: " . $impure_ratio . "%\n";
    echo "Final Status: " . $final_status . "\n";
} else {
    echo "Screening not found.\n";
}
