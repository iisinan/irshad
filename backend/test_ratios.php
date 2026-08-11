<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$screenings = \App\Models\AaoifiScreening::with('company')->get();
$diffs = [];
$statusChanges = [];

foreach ($screenings as $s) {
    if (!$s->financial_data_used) continue;
    $fin = is_string($s->financial_data_used) ? json_decode($s->financial_data_used, true) : $s->financial_data_used;
    if (!is_array($fin)) continue;
    
    $marketCap = floatval($fin['market_cap'] ?? 0);
    if ($marketCap <= 0 && $s->company && $s->company->market_cap > 0) {
        $marketCap = floatval($s->company->market_cap);
    }
    $totalAssets = floatval($fin['total_assets'] ?? 0);
    $totalDebt = floatval($fin['total_debt'] ?? 0);
    $cash = floatval($fin['cash'] ?? $fin['cash_and_equivalents'] ?? 0);
    $ibs = floatval($fin['interest_bearing_securities'] ?? 0);
    
    if ($marketCap <= 0) continue; // Cannot calculate with zero market cap
    
    $maxDenom = max($marketCap, $totalAssets);
    
    $currentDebtRatio = floatval($s->debt_ratio);
    $currentCashRatio = floatval($s->cash_ratio);
    
    $newDebtRatio = $totalDebt / $marketCap;
    $newCashRatio = ($cash + $ibs) / $marketCap;
    
    $diffDebt = abs($newDebtRatio - $currentDebtRatio);
    $diffCash = abs($newCashRatio - $currentCashRatio);
    
    if ($diffDebt > 0.01 || $diffCash > 0.01) {
        $oldDebtStatus = $s->debt_status;
        $oldCashStatus = $s->cash_status;
        $newDebtStatus = $newDebtRatio <= 0.30 ? 'pass' : 'fail';
        $newCashStatus = $newCashRatio <= 0.30 ? 'pass' : 'fail';
        
        $diffs[] = [
            'symbol' => $s->company->symbol,
            'old_debt' => $currentDebtRatio,
            'new_debt' => $newDebtRatio,
            'old_cash' => $currentCashRatio,
            'new_cash' => $newCashRatio
        ];
        
        if ($oldDebtStatus != $newDebtStatus || $oldCashStatus != $newCashStatus) {
            $newFinalStatus = ($s->business_status == 'pass' && $newDebtStatus == 'pass' && $newCashStatus == 'pass' && $s->impermissible_income_status == 'pass') ? 'halal' : 'non-halal';
            $statusChanges[] = [
                'symbol' => $s->company->symbol,
                'old_final' => $s->final_status,
                'new_final' => $newFinalStatus
            ];
        }
    }
}

echo "Total stocks with ratio diffs > 1%: " . count($diffs) . "\n";
echo "Total status changes: " . count($statusChanges) . "\n";
print_r($statusChanges);
