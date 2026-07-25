<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'ARADEL')->first();
$symbol = $company->symbol;

$fin = Illuminate\Support\Facades\DB::table('financial_screenings')
    ->where('company_ticker', $symbol)
    ->orderBy('created_at', 'desc')
    ->first();

$stage1 = cache()->remember("aaoifi_stage1_{$company->symbol}", now()->addDays(7), function () use ($company) {
    $perplexity = new \App\Services\PerplexityAiService();
    return $perplexity->runBusinessActivityScreening($company);
});

$businessStatus = 'insufficient_data';
if ($stage1) {
    if (($stage1['compliance_status'] ?? 'PASS') === 'PASS') {
        $businessStatus = 'pass';
    } elseif (($stage1['compliance_status'] ?? '') === 'FAIL') {
        $businessStatus = 'fail';
    } else {
        $businessStatus = 'warning';
    }
}
echo "Business: $businessStatus\n";

$chosen = json_decode($fin->chosen_values ?? '{}', true);
$calc = json_decode($fin->calculation_results ?? '{}', true);
$ratios = $calc['ratios'] ?? [];

$totalDebt = floatval($chosen['total_debt']['value'] ?? 0);
$marketCap = ($calc['denominator_used'] ?? null) === 'Market Capitalization' && !empty($calc['denominator_value']) ? $calc['denominator_value'] : $company->market_cap;
$cash = floatval($chosen['cash_and_equivalents']['value'] ?? 0);

$denVal = $marketCap > 0 ? $marketCap : 0;

$debtStatus = 'insufficient_data';
if ($denVal > 0) {
    $debtRatio = ($totalDebt / $denVal) * 100;
    $debtStatus = $debtRatio <= 30 ? 'pass' : ($debtRatio <= 33 ? 'warning' : 'fail');
}
echo "Debt: $debtStatus ($debtRatio)\n";

$cashStatus = 'insufficient_data';
if ($denVal > 0) {
    $cashRatio = ($cash / $denVal) * 100;
    $cashStatus = $cashRatio <= 30 ? 'pass' : ($cashRatio <= 33 ? 'warning' : 'fail');
}
echo "Cash: $cashStatus ($cashRatio)\n";

$impRatio = $ratios['non_permissible_income_ratio'] ?? null;
$impIncomeStatus = 'insufficient_data';
if ($impRatio !== null) {
    $impIncomeStatus = floatval($impRatio) <= 5 ? 'pass' : 'fail';
}
echo "Impure: $impIncomeStatus ($impRatio)\n";

$finalStatus = 'halal';
if ($businessStatus === 'fail' || $debtStatus === 'fail' || $cashStatus === 'fail' || $impIncomeStatus === 'fail') {
    $finalStatus = 'non-halal';
} elseif ($businessStatus === 'warning' || $debtStatus === 'warning' || $cashStatus === 'warning') {
    $finalStatus = 'doubtful';
} elseif ($businessStatus === 'insufficient_data' || $debtStatus === 'insufficient_data' || $cashStatus === 'insufficient_data' || $impIncomeStatus === 'insufficient_data') {
    $finalStatus = 'doubtful';
}
echo "Final: $finalStatus\n";
