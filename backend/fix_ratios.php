<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$screenings = \App\Models\AaoifiScreening::all();
$fixed = 0;
foreach ($screenings as $screening) {
    if ($screening->financial_data_used) {
        $fin = is_string($screening->financial_data_used) ? json_decode($screening->financial_data_used, true) : $screening->financial_data_used;
        
        $mc = $fin['market_cap'] ?? null;
        if (!$mc || $mc <= 0) continue;
        
        $debt = $fin['total_debt'] ?? 0;
        $cash = ($fin['cash'] ?? $fin['cash_and_equivalents'] ?? 0) + ($fin['interest_bearing_securities'] ?? 0);
        $rev = $fin['total_revenue'] ?? 0;
        $inc = $fin['interest_income'] ?? 0;
        
        $newDebt = ($debt / $mc) * 100;
        $newCash = ($cash / $mc) * 100;
        $newInc = $rev > 0 ? ($inc / $rev) * 100 : 0;
        
        // Check if current ratio in DB is suspicious (e.g. exactly $newDebt / 100)
        // Or we can just overwrite safely because the formula is the source of truth!
        $screening->debt_ratio = $newDebt;
        $screening->cash_ratio = $newCash;
        $screening->impermissible_income_ratio = $newInc;
        
        $screening->save();
        $fixed++;
    }
}
echo "Fixed ratios for $fixed companies.\n";
