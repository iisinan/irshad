<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

app()->instance('verdict.unlock', true);

$c = \App\Models\Company::where('symbol', 'JBERGER')->with('aaoifiScreening', 'status')->first();

if (!$c) {
    echo "JBERGER not found.\n";
    exit;
}

$marketCap = $c->market_cap ?: 0;
$totalAssets = 1071272602000;
$totalDebt = 56354027000;
$cash = 168804545000;
$interestBearingSecurities = 0;
$totalRevenue = 424562607000;
$impermissibleIncome = 8984939000;

$denominator = $marketCap;

$debtRatio = $totalDebt / $denominator;
$cashRatio = ($cash + $interestBearingSecurities) / $denominator;
$impermissibleIncomeRatio = $totalRevenue > 0 ? $impermissibleIncome / $totalRevenue : 0;

$debtStatus = $debtRatio <= 0.30 ? 'pass' : 'fail';
$cashStatus = $cashRatio <= 0.30 ? 'pass' : 'fail';
$impermissibleIncomeStatus = $impermissibleIncomeRatio <= 0.05 ? 'pass' : 'fail';

$businessStatus = 'halal'; // Construction is halal
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
$c->aaoifiScreening->business_reasoning = ["Julius Berger Nigeria Plc is a construction company offering civil works, building, and facility management services, which are permissible business activities."];
$c->aaoifiScreening->debt_ratio = $debtRatio;
$c->aaoifiScreening->debt_status = $debtStatus;
$c->aaoifiScreening->cash_ratio = $cashRatio;
$c->aaoifiScreening->cash_status = $cashStatus;
$c->aaoifiScreening->impermissible_income_ratio = $impermissibleIncomeRatio;
$c->aaoifiScreening->impermissible_income_status = $impermissibleIncomeStatus;
$c->aaoifiScreening->final_status = $finalStatus;
$c->aaoifiScreening->reporting_period = 'Q2';
$c->aaoifiScreening->reporting_year = 2026;

$c->aaoifiScreening->financial_data_used = [
    'source' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/47621_JULIUS_BERGER_NIGERIA_PLC-_QUARTER_2_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_JULY_2026.pdf',
    'market_cap' => $marketCap,
    'total_assets' => $totalAssets,
    'total_debt' => $totalDebt,
    'cash' => $cash,
    'interest_bearing_securities' => $interestBearingSecurities,
    'total_revenue' => $totalRevenue,
    'interest_income' => $impermissibleIncome,
    'reporting_period' => 'Q2',
    'financial_year' => 2026
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

echo "Successfully updated JBERGER.\n";
