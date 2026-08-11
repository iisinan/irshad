<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$jsonPath = __DIR__.'/updated_financials_raw.json';
$data = json_decode(file_get_contents($jsonPath), true);
$fin = $data['OKOMU'] ?? null;

if ($fin) {
    $company = \App\Models\Company::where('symbol', 'OKOMUOIL')->first();
    if ($company) {
        if ($company->market_cap != $fin['market_cap']) {
            $company->market_cap = $fin['market_cap'];
            $company->save();
        }
        
        $screening = \App\Models\AaoifiScreening::firstOrNew(['company_id' => $company->id]);
        $existingFin = $screening->financial_data_used ? (is_string($screening->financial_data_used) ? json_decode($screening->financial_data_used, true) : $screening->financial_data_used) : [];
        if (!is_array($existingFin)) $existingFin = [];
        
        $existingFin['market_cap'] = $fin['market_cap'];
        $existingFin['total_debt'] = $fin['total_debt'];
        $existingFin['cash_and_equivalents'] = $fin['cash_and_equivalents'];
        $existingFin['interest_bearing_securities'] = $fin['interest_bearing_securities'];
        $existingFin['total_revenue'] = $fin['total_revenue'];
        $existingFin['interest_income'] = $fin['interest_income'];
        
        $screening->financial_data_used = json_encode($existingFin);
        
        $marketCap = $fin['market_cap'];
        $totalDebt = $fin['total_debt'];
        $cash = $fin['cash_and_equivalents'] + $fin['interest_bearing_securities'];
        $totalRev = $fin['total_revenue'];
        $intIncome = $fin['interest_income'];
        
        $newDebtRatio = $marketCap > 0 ? $totalDebt / $marketCap : 0;
        $newCashRatio = $marketCap > 0 ? $cash / $marketCap : 0;
        $newImpIncomeRatio = $totalRev > 0 ? $intIncome / $totalRev : 0;
        
        $screening->debt_ratio = $newDebtRatio;
        $screening->cash_ratio = $newCashRatio;
        $screening->impermissible_income_ratio = $newImpIncomeRatio;
        
        $screening->debt_status = $newDebtRatio <= 0.30 ? 'pass' : 'fail';
        $screening->cash_status = $newCashRatio <= 0.30 ? 'pass' : 'fail';
        $screening->impermissible_income_status = $newImpIncomeRatio <= 0.05 ? 'pass' : 'fail';
        
        $busStatus = $screening->business_status ?: 'pass';
        $newFinalStatus = ($busStatus == 'pass' && $screening->debt_status == 'pass' && $screening->cash_status == 'pass' && $screening->impermissible_income_status == 'pass') ? 'halal' : 'non-halal';
        
        $screening->final_status = $newFinalStatus;
        $screening->save();
        
        if ($company->current_status != $newFinalStatus) {
            $company->current_status = $newFinalStatus;
            $company->save();
        }
        
        $status = $company->status;
        if ($status && $status->status != $newFinalStatus) {
            $status->status = $newFinalStatus;
            $status->save();
        } elseif (!$status) {
            $company->status()->create(['status' => $newFinalStatus, 'verified_by_scholar' => false]);
        }
        
        echo "Updated OKOMUOIL to " . strtoupper($newFinalStatus) . "\n";
    }
}
