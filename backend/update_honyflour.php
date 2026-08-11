<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

app()->instance('verdict.unlock', true);

$c = \App\Models\Company::where('symbol', 'HONYFLOUR')->with('aaoifiScreening', 'status')->first();

if (!$c) {
    echo "HONYFLOUR not found.\n";
    exit;
}

$marketCap = $c->market_cap ?: 0;
$totalAssets = 310180000000;
$totalDebt = 41973000000;
$cash = 13778000000;
$interestBearingSecurities = 0;
$totalRevenue = 112867000000;
$impermissibleIncome = 2127000000;

$denominator = $marketCap;

$debtRatio = $totalDebt / $denominator;
$cashRatio = ($cash + $interestBearingSecurities) / $denominator;
$impermissibleIncomeRatio = $totalRevenue > 0 ? $impermissibleIncome / $totalRevenue : 0;

$debtStatus = $debtRatio <= 0.30 ? 'pass' : 'fail';
$cashStatus = $cashRatio <= 0.30 ? 'pass' : 'fail';
$impermissibleIncomeStatus = $impermissibleIncomeRatio <= 0.05 ? 'pass' : 'fail';

$businessStatus = 'halal'; // Manufacturing flour is halal
$finalStatus = ($businessStatus == 'halal' && $debtStatus == 'pass' && $cashStatus == 'pass' && $impermissibleIncomeStatus == 'pass') ? 'halal' : 'non-halal';

echo "Debt Ratio: " . number_format($debtRatio * 100, 2) . "% ($debtStatus)\n";
echo "Cash Ratio: " . number_format($cashRatio * 100, 2) . "% ($cashStatus)\n";
echo "Impermissible Income Ratio: " . number_format($impermissibleIncomeRatio * 100, 2) . "% ($impermissibleIncomeStatus)\n";
echo "Final Status: $finalStatus\n";

if (!$c->aaoifiScreening) {
    $c->aaoifiScreening = new \App\Models\AaoifiScreening();
    $c->aaoifiScreening->company_id = $c->id;
}

$c->aaoifiScreening->business_status = $businessStatus;
$c->aaoifiScreening->business_reasoning = ["Honeywell Flour Mills Plc is engaged in the manufacturing and marketing of wheat-based products, which is a permissible business activity."];
$c->aaoifiScreening->debt_ratio = $debtRatio;
$c->aaoifiScreening->debt_status = $debtStatus;
$c->aaoifiScreening->cash_ratio = $cashRatio;
$c->aaoifiScreening->cash_status = $cashStatus;
$c->aaoifiScreening->impermissible_income_ratio = $impermissibleIncomeRatio;
$c->aaoifiScreening->impermissible_income_status = $impermissibleIncomeStatus;
$c->aaoifiScreening->final_status = $finalStatus;
$c->aaoifiScreening->reporting_period = 'Q1';
$c->aaoifiScreening->reporting_year = 2026;

$c->aaoifiScreening->financial_data_used = [
    'source' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/47665_HONEYWELL_FLOUR_MILL_PLC-_QUARTER_1_-_FINANCIAL_STATEMENT_FOR_2027_FINANCIAL_STATEMENTS_JULY_2026.pdf',
    'market_cap' => $marketCap,
    'total_assets' => $totalAssets,
    'total_debt' => $totalDebt,
    'cash' => $cash,
    'interest_bearing_securities' => $interestBearingSecurities,
    'total_revenue' => $totalRevenue,
    'interest_income' => $impermissibleIncome,
    'reporting_period' => 'Q1',
    'financial_year' => 2027
];

$c->aaoifiScreening->save();

$c->current_status = $finalStatus;
$c->save();

if ($c->status) {
    $c->status->status = $finalStatus;
    $c->status->save();
} else {
    $c->status()->create(['status' => $finalStatus, 'verified_by_scholar' => false]);
}

echo "Successfully updated HONYFLOUR.\n";
