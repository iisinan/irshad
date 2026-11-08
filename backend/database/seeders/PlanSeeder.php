<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plan;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Miftah',
                'slug' => 'free',
                'price_monthly' => 0,
                'price_quarterly' => 0,
                'price_quarterly_regular' => 0,
                'price_yearly' => 0,
                'price_yearly_regular' => 0,
                'features' => [
                    'stock_screens_per_month' => 3,
                    'portfolio_limit' => 3,
                    'watchlist_limit' => 0,
                    'baskets' => 0,
                    'statements' => false,
                    'purifications_per_month' => 0,
                    'zakat_calc' => false,
                    'dividend_alerts' => false,
                    'drift_tracking' => false,
                    'monthly_spotlight' => false,
                ],
            ],
            [
                'name' => 'Rawdha',
                'slug' => 'pro',
                'price_monthly' => 0,
                'price_quarterly' => 6500,
                'price_quarterly_regular' => 7500,
                'price_yearly' => 25000,
                'price_yearly_regular' => 30000,
                'features' => [
                    'stock_screens_per_month' => 10,
                    'portfolio_limit' => 7,
                    'watchlist_limit' => 2,
                    'baskets' => 3, // 1 curated, 2 custom
                    'statements' => true,
                    'purifications_per_month' => 2,
                    'zakat_calc' => true,
                    'dividend_alerts' => false,
                    'drift_tracking' => false,
                    'monthly_spotlight' => false,
                ],
            ],
            [
                'name' => 'Noor',
                'slug' => 'max',
                'price_monthly' => 0,
                'price_quarterly' => 8500,
                'price_quarterly_regular' => 10000,
                'price_yearly' => 33000,
                'price_yearly_regular' => 40000,
                'features' => [
                    'stock_screens_per_month' => -1, // -1 for unlimited
                    'portfolio_limit' => -1,
                    'watchlist_limit' => -1,
                    'baskets' => -1,
                    'statements' => true,
                    'purifications_per_month' => -1,
                    'zakat_calc' => true,
                    'dividend_alerts' => true,
                    'drift_tracking' => true,
                    'monthly_spotlight' => true,
                ],
            ]
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
