<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$companies = App\Models\Company::whereNotNull('latest_price')->where('latest_price', '>', 0)->get();
echo "Found {$companies->count()} companies.\n";

foreach ($companies as $company) {
    $volatility = rand(5, 30) / 1000;
    $currentSimulatedPrice = $company->latest_price;
    $history = [];
    $today = \Carbon\Carbon::today();
    for ($i = 1; $i <= 30; $i++) {
        $date = $today->copy()->subDays($i);
        if ($date->isWeekend()) continue;
        
        $dailyChangePct = (rand(-100, 100) / 100) * $volatility;
        $prevPrice = round($currentSimulatedPrice / (1 + $dailyChangePct), 2);
        
        $history[] = [
            'company_id' => $company->id,
            'date' => $date->toDateString(),
            'price' => $prevPrice,
            'volume' => rand(1000, 5000000),
            'created_at' => now(),
            'updated_at' => now(),
        ];
        $currentSimulatedPrice = $prevPrice;
    }
    App\Models\DailyPrice::insert($history);
}
echo "Done seeding.\n";
