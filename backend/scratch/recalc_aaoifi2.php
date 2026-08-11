<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;

// Helper for exact calculation to 4 decimal places
function exact_calc($num, $den) {
    if ($den == 0 || $den == null) return 0.0;
    
    // 1. Float calc
    $calc1 = round((floatval($num) / floatval($den)) * 100, 4);
    
    // 2. BCMath calc (Arbitrary Precision)
    $calc2 = round(floatval(bcdiv(bcmul(strval($num), '100', 8), strval($den), 8)), 4);
    
    return $calc2;
}

$screenings = AaoifiScreening::whereIn('business_status', ['pass', 'halal'])->with('company')->get();

$changed = 0;
$fixed = 0;

foreach ($screenings as $aaoifi) {
    $c = $aaoifi->company;
    if (!$c) continue;

    $raw = is_string($aaoifi->financial_data_used) ? json_decode($aaoifi->financial_data_used, true) : $aaoifi->financial_data_used;
    if (!$raw || !isset($raw['market_cap'])) {
        continue;
    }

    $market_cap = $raw['market_cap'] ?? 0;
    $total_debt = $raw['total_debt'] ?? 0;
    $cash = $raw['cash'] ?? 0;
    $interest_bearing_sec = $raw['interest_bearing_securities'] ?? 0;
    $total_revenue = $raw['total_revenue'] ?? 0;
    $interest_income = $raw['interest_income'] ?? 0;
    
    $old_final = $aaoifi->final_status;

    $debt_ratio_pct = exact_calc($total_debt, $market_cap);
    $cash_ratio_pct = exact_calc($cash + $interest_bearing_sec, $market_cap);
    $inc_ratio_pct = exact_calc($interest_income, $total_revenue);

    // strict thresholds
    $debt_pass = $debt_ratio_pct <= 30.00 ? 'pass' : 'fail';
    $cash_pass = $cash_ratio_pct <= 30.00 ? 'pass' : 'fail';
    $inc_pass = $inc_ratio_pct <= 5.00 ? 'pass' : 'fail';
    
    // Islamic Financial Institutions Exemption (No Conventional Debt/Interest)
    if ($c->symbol === 'JAIZBANK' || str_contains(strtoupper($c->name), 'ISLAMIC')) {
        $debt_pass = 'pass';
        $cash_pass = 'pass';
        $inc_pass = 'pass';
    }

    $new_final = ($debt_pass == 'pass' && $cash_pass == 'pass' && $inc_pass == 'pass') ? 'halal' : 'non-halal';

    $aaoifi->debt_ratio = $debt_ratio_pct;
    $aaoifi->debt_status = $debt_pass;
    $aaoifi->cash_ratio = $cash_ratio_pct;
    $aaoifi->cash_status = $cash_pass;
    $aaoifi->impermissible_income_ratio = $inc_ratio_pct;
    $aaoifi->impermissible_income_status = $inc_pass;
    $aaoifi->final_status = $new_final;
    $aaoifi->save();

    // Sync to company
    if ($c->current_status !== $new_final) {
        $c->current_status = $new_final;
        $c->save();
        $changed++;
        echo "CHANGED VERDICT: {$c->symbol} went from $old_final to $new_final (Debt: $debt_ratio_pct%, Cash: $cash_ratio_pct%, Inc: $inc_ratio_pct%)\n";
    }

    // Sync to status table
    $status = StockStatus::where('company_id', $c->id)->first();
    if ($status) {
        if ($status->status !== $new_final) {
            $status->status = $new_final;
            if ($new_final == 'halal') {
                $status->reason = null; 
            } else {
                $status->reason = "Failed AAOIFI financial ratio screening.";
            }
            $status->save();
        }
    } else {
        $c->status()->create(['status' => $new_final, 'verified_by_scholar' => false]);
    }
    $fixed++;
}

echo "Successfully verified and fixed math for $fixed companies.\n";
echo "Total companies that had a verdict change: $changed\n";
