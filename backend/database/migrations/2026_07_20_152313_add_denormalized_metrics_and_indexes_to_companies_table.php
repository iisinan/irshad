<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->decimal('latest_price', 10, 2)->nullable()->after('overview');
            $table->decimal('price_change', 10, 2)->nullable()->after('latest_price');
            $table->decimal('price_change_pct', 10, 2)->nullable()->after('price_change');
            $table->string('current_status')->nullable()->after('price_change_pct');
            $table->decimal('market_cap', 20, 2)->nullable()->after('current_status');
            $table->decimal('pe_ratio', 10, 2)->nullable()->after('market_cap');
            $table->decimal('eps', 10, 2)->nullable()->after('pe_ratio');
            
            // Indexes for fast filtering
            $table->index('sector');
            $table->index('symbol');
            $table->index('current_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropIndex(['sector']);
            $table->dropIndex(['symbol']);
            $table->dropIndex(['current_status']);
            
            $table->dropColumn([
                'latest_price',
                'price_change',
                'price_change_pct',
                'current_status',
                'market_cap',
                'pe_ratio',
                'eps'
            ]);
        });
    }
};
