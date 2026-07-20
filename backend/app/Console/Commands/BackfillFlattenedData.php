<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;

class BackfillFlattenedData extends Command
{
    protected $signature = 'data:backfill';
    protected $description = 'Backfills flattened data onto the companies table';

    public function handle()
    {
        $companies = Company::with(['status', 'financials' => fn($q) => $q->latest(), 'dailyPrices' => fn($q) => $q->latest('date')->limit(2)])->get();
        $this->info("Backfilling " . $companies->count() . " companies...");
        
        foreach ($companies as $company) {
            $fin = $company->financials->first();
            $prices = $company->dailyPrices;
            $latest = $prices->first();
            $prev = $prices->skip(1)->first();

            $latestPrice = (float) ($latest?->price ?? 0);
            $prevPrice   = (float) ($prev?->price ?? $latestPrice);
            $change      = $latestPrice - $prevPrice;
            
            $changePct = (float) ($latest?->change_pct ?? 0);
            if ($changePct == 0 && $prevPrice > 0) {
                $changePct = round(($change / $prevPrice) * 100, 2);
            }

            $company->update([
                'current_status' => $company->status ? $company->status->status : null,
                'market_cap' => $fin ? $fin->market_cap : 0,
                'eps' => $fin ? $fin->eps : null,
                'pe_ratio' => $fin ? $fin->pe_ratio : null,
                'latest_price' => $latestPrice,
                'price_change' => round($change, 2),
                'price_change_pct' => $changePct,
            ]);
        }
        
        $this->info("Done backfilling.");
    }
}
