<?php

use App\Models\Plan;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $pro = Plan::where('slug', 'pro')->first();
        if ($pro) {
            $features = $pro->features ?? [];
            $features['stock_screens_per_month'] = 30;
            $features['purifications_per_month'] = 6;
            $pro->update(['features' => $features]);
        }
    }

    public function down(): void
    {
        $pro = Plan::where('slug', 'pro')->first();
        if ($pro) {
            $features = $pro->features ?? [];
            $features['stock_screens_per_month'] = 10;
            $features['purifications_per_month'] = 2;
            $pro->update(['features' => $features]);
        }
    }
};
