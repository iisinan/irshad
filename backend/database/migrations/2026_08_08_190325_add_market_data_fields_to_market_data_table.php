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
        Schema::table('market_data', function (Blueprint $table) {
            $table->decimal('open_price', 10, 2)->nullable();
            $table->decimal('previous_close', 10, 2)->nullable();
            $table->decimal('day_high', 10, 2)->nullable();
            $table->decimal('day_low', 10, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('market_data', function (Blueprint $table) {
            $table->dropColumn([
                'open_price',
                'previous_close',
                'day_high',
                'day_low'
            ]);
        });
    }
};
