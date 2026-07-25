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
        Schema::create('market_data_history', function (Blueprint $table) {
            $table->id();
            $table->string('company_ticker');
            $table->decimal('share_price', 15, 4);
            $table->decimal('market_cap', 20, 2);
            $table->bigInteger('shares_outstanding')->nullable();
            $table->decimal('daily_change', 10, 4)->nullable();
            $table->string('trading_status')->nullable();
            $table->bigInteger('volume')->nullable();
            $table->string('source');
            $table->timestamp('snapshot_time');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('market_data_history');
    }
};
