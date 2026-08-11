<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$screenings = \App\Models\AaoifiScreening::with('company')->get();
$count = 0;

foreach ($screenings as $s) {
    if (!$s->financial_data_used) continue;
    $fin = is_string($s->financial_data_used) ? json_decode($s->financial_data_used, true) : $s->financial_data_used;
    if (!is_array($fin)) continue;
    
    $marketCap = floatval($fin['market_cap'] ?? 0);
    if ($marketCap <= 0 && $s->company && $s->company->market_cap > 0) {
        $marketCap = floatval($s->company->market_cap);
    }
    
    $totalDebt = floatval($fin['total_debt'] ?? 0);
    $cash = floatval($fin['cash'] ?? $fin['cash_and_equivalents'] ?? 0);
    $ibs = floatval($fin['interest_bearing_securities'] ?? 0);
    $totalRev = floatval($fin['total_revenue'] ?? 0);
    $intIncome = floatval($fin['interest_income'] ?? 0);
    
    if ($marketCap <= 0) continue; 
    
    $newDebtRatio = $totalDebt / $marketCap;
    $newCashRatio = ($cash + $ibs) / $marketCap;
    
    // impermissible income is against total revenue
    $newImpIncomeRatio = $totalRev > 0 ? $intIncome / $totalRev : 0;
    
    $s->debt_ratio = $newDebtRatio;
    $s->cash_ratio = $newCashRatio;
    $s->impermissible_income_ratio = $newImpIncomeRatio;
    
    $s->debt_status = $newDebtRatio <= 0.30 ? 'pass' : 'fail';
    $s->cash_status = $newCashRatio <= 0.30 ? 'pass' : 'fail';
    $s->impermissible_income_status = $newImpIncomeRatio <= 0.05 ? 'pass' : 'fail';
    
    $newFinalStatus = ($s->business_status == 'pass' && $s->debt_status == 'pass' && $s->cash_status == 'pass' && $s->impermissible_income_status == 'pass') ? 'halal' : 'non-halal';
    
    $s->final_status = $newFinalStatus;
    $s->save();
    
    if ($s->company) {
        if ($s->company->current_status != $newFinalStatus) {
            $s->company->current_status = $newFinalStatus;
            $s->company->save();
        }
        
        $status = $s->company->status;
        if ($status && $status->status != $newFinalStatus) {
            $status->status = $newFinalStatus;
            $status->save();
        } elseif (!$status) {
            $s->company->status()->create(['status' => $newFinalStatus, 'verified_by_scholar' => false]);
        }
    }
    
    $count++;
}

echo "Updated $count stocks to use strict market cap.\n";
