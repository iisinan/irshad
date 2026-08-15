<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;
use App\Models\Company;
use App\Models\StockStatus;

$company = Company::where('symbol', 'LEGENDINT')->first();
if (!$company) {
    echo "LEGENDINT not found.\n";
    exit;
}

$screening = AaoifiScreening::where('company_id', $company->id)->first();
if (!$screening) {
    echo "No AaoifiScreening found.\n";
    exit;
}

$total_assets = 10136891000;
$total_debt = 7428137000;
$cash = 33236000;
$interest_income = 61017000;
$total_revenue = 817071000;

$debt_ratio = $total_debt / $total_assets;
$cash_ratio = $cash / $total_assets;
$impermissible_income_ratio = $interest_income / $total_revenue;

$screening->debt_ratio = $debt_ratio;
$screening->cash_ratio = $cash_ratio;
$screening->impermissible_income_ratio = $impermissible_income_ratio;

$screening->debt_status = $debt_ratio < 0.30 ? 'pass' : 'fail';
$screening->cash_status = $cash_ratio < 0.30 ? 'pass' : 'fail';
$screening->impermissible_income_status = $impermissible_income_ratio < 0.05 ? 'pass' : 'fail';

$screening->financial_data_used = json_encode([
    'total_assets' => $total_assets,
    'total_debt' => $total_debt,
    'cash' => $cash,
    'interest_income' => $interest_income,
    'total_revenue' => $total_revenue
]);

$screening->final_status = ($screening->business_status === 'pass' && $screening->debt_status === 'pass' && $screening->cash_status === 'pass' && $screening->impermissible_income_status === 'pass') ? 'halal' : 'non-halal';

$screening->save();

$company->current_status = $screening->final_status;
$company->save();

// Update or create StockStatus to reflect the manual classification or automated
$status = StockStatus::firstOrNew(['company_id' => $company->id]);
$status->status = $screening->final_status;
$status->reason = "Manual classification.";
$status->save();

echo "LEGENDINT updated successfully.\n";
echo "Debt Ratio: " . number_format($debt_ratio * 100, 2) . "%\n";
echo "Cash Ratio: " . number_format($cash_ratio * 100, 2) . "%\n";
echo "Imp Inc Ratio: " . number_format($impermissible_income_ratio * 100, 2) . "%\n";
echo "Final Status: " . $screening->final_status . "\n";
