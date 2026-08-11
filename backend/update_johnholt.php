<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$symbol = 'JOHNHOLT';
$company = \App\Models\Company::where('symbol', $symbol)->first();
$screening = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();

$data = is_array($screening->financial_data_used) ? $screening->financial_data_used : json_decode($screening->financial_data_used, true);
$data['total_debt'] = 954000000 + 815000000; // Adding Due to Related Parties (Current + Non-Current)
$screening->financial_data_used = $data;

$marketCap = $data['market_cap'];
$totalDebt = $data['total_debt'];
$cash = $data['cash'];
$impInc = $data['interest_income'];
$revenue = $data['total_revenue'];

$screening->debt_ratio = $totalDebt / $marketCap;
$screening->cash_ratio = $cash / $marketCap;
$screening->impermissible_income_ratio = $impInc / $revenue;

$screening->debt_status = ($screening->debt_ratio < 0.30) ? 'pass' : 'fail';
$screening->cash_status = ($screening->cash_ratio < 0.30) ? 'pass' : 'fail';
$screening->impermissible_income_status = ($screening->impermissible_income_ratio < 0.05) ? 'pass' : 'fail';

$busStatus = $screening->business_status ?: 'pass';
$busPass = in_array(strtolower($busStatus), ['pass', 'halal']);
$finPass = ($screening->debt_status == 'pass' && $screening->cash_status == 'pass' && $screening->impermissible_income_status == 'pass');

$newFinalStatus = ($busPass && $finPass) ? 'halal' : 'non-halal';
$screening->final_status = $newFinalStatus;
$screening->save();

$company->current_status = $newFinalStatus;
$company->save();
$status = $company->status;
if ($status) {
    $status->status = $newFinalStatus;
    $status->save();
} else {
    $company->status()->create(['status' => $newFinalStatus, 'verified_by_scholar' => false]);
}

echo "Updated $symbol.\n";
echo "Debt: " . number_format($totalDebt) . "\n";
echo "Debt Ratio: " . round($screening->debt_ratio * 100, 2) . "%\n";
echo "Final Status: " . $newFinalStatus . "\n";
