<?php

use App\Models\Company;
use App\Models\DailyPrice;
use App\Models\Dividend;
use App\Models\Watchlist;
use App\Models\Holding;

$oneWeekAgo = now()->subDays(7)->toDateString();

// 1. Get weekly performance for all Halal companies
$halalCompanies = Company::whereHas('stockStatus', function($q) {
    $q->whereIn('status', ['halal', 'compliant']);
})->get();

$performances = [];
foreach ($halalCompanies as $company) {
    $prices = DailyPrice::where('company_id', $company->id)
        ->where('date', '>=', $oneWeekAgo)
        ->orderBy('date', 'asc')
        ->get();
    
    if ($prices->count() >= 2) {
        $startPrice = $prices->first()->price;
        $endPrice = $prices->last()->price;
        if ($startPrice > 0) {
            $changePct = (($endPrice - $startPrice) / $startPrice) * 100;
            $performances[] = [
                'symbol' => $company->symbol,
                'change_pct' => $changePct,
                'current_price' => $endPrice,
            ];
        }
    }
}

usort($performances, fn($a, $b) => $b['change_pct'] <=> $a['change_pct']);

$topGainers = array_slice($performances, 0, 3);
$topLosers = array_slice(array_reverse($performances), 0, 3);

$dividendsThisWeek = Dividend::with('company')
    ->where('created_at', '>=', now()->subDays(7))
    ->get();

echo "Top Gainers:\n";
print_r($topGainers);
echo "Top Losers:\n";
print_r($topLosers);
echo "Dividends:\n";
print_r($dividendsThisWeek->count());
