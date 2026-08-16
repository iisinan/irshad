<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

// Values in Naira
$total_assets = 1414255000; 
$total_debt = 1367532000;
$cash = 1967000;
$total_revenue = 27200000;
$interest_income = 0;

$company = Company::where('symbol', 'AUSTINLAZ')->first();

if (!$company) {
    echo "Austin Laz not found!\n";
    exit;
}

$market_cap = $company->market_cap ?: $total_assets;

$denominator = max($market_cap, $total_assets);
$debt_ratio = ($total_debt / $denominator) * 100;
$cash_ratio = ($cash / $denominator) * 100;
$impure_ratio = $total_revenue > 0 ? ($interest_income / $total_revenue) * 100 : 0;

$financial_status = ($debt_ratio <= 30 && $cash_ratio <= 30 && $impure_ratio <= 5) ? 'pass' : 'fail';

$screening = AaoifiScreening::where('company_id', $company->id)->latest()->first();
if ($screening) {
    $screening->update([
        'debt_ratio' => $debt_ratio,
        'cash_ratio' => $cash_ratio,
        'impermissible_income_ratio' => $impure_ratio,
        'financial_status' => $financial_status,
        'financial_data_used' => [
            'total_assets' => $total_assets,
            'total_debt' => $total_debt,
            'cash_and_equivalents' => $cash,
            'total_revenue' => $total_revenue,
            'interest_income' => $interest_income,
            'market_cap' => $market_cap
        ],
        'denominator_used' => $market_cap > $total_assets ? 'Market Cap' : 'Total Assets',
        'evidence_link' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/47776_AUSTIN_LAZ_AND_COMPANY_PLC-_QUARTER_2_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_AUGUST_2026.pdf'
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
            'reason' => 'Updated via Q2 2026 financials.'
        ]
    );
    
    echo "Successfully updated Austin Laz (AUSTINLAZ).\n";
    echo "Debt Ratio: " . round($debt_ratio, 2) . "%\n";
    echo "Cash Ratio: " . round($cash_ratio, 2) . "%\n";
    echo "Impure Income Ratio: " . round($impure_ratio, 2) . "%\n";
    echo "Final Status: " . $final_status . "\n";
} else {
    echo "Screening not found.\n";
}
