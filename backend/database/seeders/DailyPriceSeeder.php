<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\DailyPrice;

class DailyPriceSeeder extends Seeder
{
    public function run()
    {
        $companies = Company::all();
        foreach ($companies as $company) {
            $basePrice = rand(10, 500) + (rand(0, 99) / 100);
            
            // Previous Day
            DailyPrice::updateOrCreate(
                ['company_id' => $company->id, 'date' => now()->subDay()->toDateString()],
                ['price' => $basePrice, 'volume' => rand(1000, 50000)]
            );
            
            // Today
            $change = $basePrice * (rand(-50, 50) / 1000); // +/- 5%
            $todayPrice = $basePrice + $change;
            DailyPrice::updateOrCreate(
                ['company_id' => $company->id, 'date' => now()->toDateString()],
                ['price' => $todayPrice, 'volume' => rand(1000, 50000)]
            );
        }
    }
}
