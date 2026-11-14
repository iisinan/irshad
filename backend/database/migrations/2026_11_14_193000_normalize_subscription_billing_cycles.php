<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('subscriptions')) {
            DB::table('subscriptions')
                ->where('billing_cycle', 'monthly')
                ->update(['billing_cycle' => 'quarterly']);
        }

        if (Schema::hasTable('payment_transactions')) {
            DB::table('payment_transactions')
                ->where('billing_cycle', 'monthly')
                ->update(['billing_cycle' => 'quarterly']);
        }
    }

    public function down(): void
    {
        // Non-destructive normalization
    }
};
