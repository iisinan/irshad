<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Plan;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $free = Plan::where('slug', 'free')->first();
        if ($free) {
            $features = $free->features ?? [];
            $features['portfolio_limit'] = 3;
            $features['stock_screens_per_month'] = 3;
            $features['purifications_per_month'] = 0;
            $features['zakat_calc'] = false;
            $free->update(['features' => $features]);
        }

        $pro = Plan::where('slug', 'pro')->first();
        if ($pro) {
            $features = $pro->features ?? [];
            $features['portfolio_limit'] = 7;
            $features['stock_screens_per_month'] = 10;
            $features['purifications_per_month'] = 2;
            $features['zakat_calc'] = true;
            $pro->update(['features' => $features]);
        }

        $max = Plan::where('slug', 'max')->first();
        if ($max) {
            $features = $max->features ?? [];
            $features['portfolio_limit'] = -1;
            $features['stock_screens_per_month'] = -1;
            $features['purifications_per_month'] = -1;
            $features['zakat_calc'] = true;
            $max->update(['features' => $features]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $free = Plan::where('slug', 'free')->first();
        if ($free) {
            $features = $free->features ?? [];
            $features['portfolio_limit'] = 1;
            $free->update(['features' => $features]);
        }

        $pro = Plan::where('slug', 'pro')->first();
        if ($pro) {
            $features = $pro->features ?? [];
            $features['stock_screens_per_month'] = 5;
            $features['purifications_per_month'] = 0;
            $pro->update(['features' => $features]);
        }
    }
};
