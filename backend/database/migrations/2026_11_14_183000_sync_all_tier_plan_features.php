<?php

use App\Models\Plan;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $plans = [
            'free' => [
                'name' => 'Miftah',
                'price_monthly' => 0,
                'price_quarterly' => 0,
                'price_quarterly_regular' => 0,
                'price_yearly' => 0,
                'price_yearly_regular' => 0,
                'features' => json_encode(Plan::defaultFeaturesForSlug('free')),
            ],
            'pro' => [
                'name' => 'Rawdha',
                'price_monthly' => 0,
                'price_quarterly' => 6500,
                'price_quarterly_regular' => 7500,
                'price_yearly' => 25000,
                'price_yearly_regular' => 30000,
                'features' => json_encode(Plan::defaultFeaturesForSlug('pro')),
            ],
            'max' => [
                'name' => 'Noor',
                'price_monthly' => 0,
                'price_quarterly' => 8500,
                'price_quarterly_regular' => 10000,
                'price_yearly' => 33000,
                'price_yearly_regular' => 40000,
                'features' => json_encode(Plan::defaultFeaturesForSlug('max')),
            ],
        ];

        foreach ($plans as $slug => $data) {
            DB::table('plans')->updateOrInsert(['slug' => $slug], $data);
        }
    }

    public function down(): void
    {
        // Non-destructive sync of tier feature flags
    }
};
