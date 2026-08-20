<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AaoifiScreening;
use App\Models\Company;

$screenings = AaoifiScreening::all();
$updated = 0;

foreach ($screenings as $screening) {
    $company = $screening->company;
    if (!$company || $company->symbol === 'JAIZBANK') continue;

    $financials = $screening->financial_data_used;
    if (is_string($financials)) {
        $financials = json_decode($financials, true);
    }
    if (!is_array($financials)) {
        continue;
    }

    $marketCap = (string) ($financials['market_cap'] ?? ($company->market_cap ?: '0'));
    $totalAssets = (string) ($financials['total_assets'] ?? '0');
    $denominator = bccomp($marketCap, $totalAssets, 4) === 1 ? $marketCap : $totalAssets;

    $totalDebt = (string) ($financials['total_debt'] ?? '0');
    $cash = (string) ($financials['cash_and_equivalents'] ?? ($financials['cash'] ?? '0'));
    $interestBearingSecurities = (string) ($financials['interest_bearing_securities'] ?? '0');
    $cashAndSecurities = bcadd($cash, $interestBearingSecurities, 4);
    
    $totalRevenue = (string) ($financials['total_revenue'] ?? '0');
    $interestIncome = (string) ($financials['interest_income'] ?? '0');

    if (bccomp($denominator, '0', 4) === 1) {
        $debtRatioRaw = bcdiv($totalDebt, $denominator, 6);
        $debtRatio = (float) bcmul($debtRatioRaw, '100', 4);
        
        $cashRatioRaw = bcdiv($cashAndSecurities, $denominator, 6);
        $cashRatio = (float) bcmul($cashRatioRaw, '100', 4);
        
        $screening->debt_ratio = $debtRatio;
        $screening->debt_status = bccomp($debtRatioRaw, '0.3000', 4) <= 0 ? 'pass' : 'fail';
        
        $screening->cash_ratio = $cashRatio;
        $screening->cash_status = bccomp($cashRatioRaw, '0.3000', 4) <= 0 ? 'pass' : 'fail';
    } else {
        $screening->debt_ratio = null;
        $screening->debt_status = 'fail';
        $screening->cash_ratio = null;
        $screening->cash_status = 'fail';
    }

    if (bccomp($totalRevenue, '0', 4) === 1) {
        $impureRatioRaw = bcdiv($interestIncome, $totalRevenue, 6);
        $impureRatio = (float) bcmul($impureRatioRaw, '100', 4);
        
        $screening->impermissible_income_ratio = $impureRatio;
        
        $reits = ['NESF', 'SKYESHELT', 'UHOMREIT', 'UPDC REIT', 'UPDCREIT'];
        if (in_array(strtoupper($company->symbol), $reits)) {
            $screening->impermissible_income_status = 'pass';
        } else {
            $screening->impermissible_income_status = bccomp($impureRatioRaw, '0.0500', 4) <= 0 ? 'pass' : 'fail';
        }
    } else {
        $screening->impermissible_income_ratio = 0;
        $screening->impermissible_income_status = bccomp($interestIncome, '0', 4) === 1 ? 'fail' : 'pass';
    }
    
    // Financial Data Used sync
    $financials['market_cap'] = (float) $marketCap;
    $screening->financial_data_used = $financials;

    // Recalculate Final Status
    $finalStatus = 'halal';
    if ($screening->business_status === 'fail' || $screening->debt_status === 'fail' || $screening->cash_status === 'fail' || $screening->impermissible_income_status === 'fail') {
        $finalStatus = 'non-compliant';
    } elseif ($screening->business_status === 'warning' || $screening->business_status === 'doubtful' || $screening->debt_status === 'insufficient_data' || $screening->cash_status === 'insufficient_data') {
        $finalStatus = 'doubtful';
    }

    $screening->final_status = $finalStatus;
    $screening->save();
    
    // Auto-update Company Status if no scholar verified override
    $stockStatus = $company->status()->first();
    if (!$stockStatus || !$stockStatus->verified_by_scholar) {
        if ($company->current_status !== $finalStatus) {
            $company->update(['current_status' => $finalStatus]);
            \App\Models\StockStatus::updateOrCreate(
                ['company_id' => $company->id],
                [
                    'status' => $finalStatus,
                    'reason' => 'Updated by BCMath percentage correction.',
                    'verified_by_scholar' => false,
                    'last_updated' => now(),
                ]
            );
        }
    }

    $updated++;
}

echo "Successfully recalculated and fixed $updated screenings directly from financial_data_used.\n";
\Illuminate\Support\Facades\Artisan::call('cache:clear');
echo "Caches cleared.\n";
