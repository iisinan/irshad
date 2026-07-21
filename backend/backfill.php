<?php
use App\Models\Company;
use App\Models\DailyPrice;
use Illuminate\Support\Facades\DB;

$companies = Company::all();
$today = now()->startOfDay();

DB::beginTransaction();
try {
    foreach ($companies as $company) {
        $latestPrice = $company->latest_price;
        if ($latestPrice <= 0) continue;

        // Generate 30 days of history
        $currentSimulatedPrice = $latestPrice;
        
        for ($i = 1; $i <= 30; $i++) {
            $date = $today->copy()->subDays($i);
            
            // Skip weekends
            if ($date->isWeekend()) continue;

            // Random fluctuation between -2% and +2%
            $changePct = (mt_rand(-200, 200) / 100); 
            $changeAmount = $currentSimulatedPrice * ($changePct / 100);
            
            $previousDayPrice = $currentSimulatedPrice - $changeAmount;
            
            // Avoid negative prices
            if ($previousDayPrice <= 0) $previousDayPrice = 0.01;

            DailyPrice::updateOrCreate(
                ['company_id' => $company->id, 'date' => $date->toDateString()],
                [
                    'price' => round($previousDayPrice, 2),
                    'volume' => mt_rand(10000, 5000000),
                    'change_pct' => round($changePct, 4),
                ]
            );
            
            $currentSimulatedPrice = $previousDayPrice;
        }
    }
    DB::commit();
    echo "Successfully backfilled 30 days of simulated history for all companies.\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
