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
        Schema::create('market_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('ticker')->index();
            $table->decimal('latest_price', 15, 4)->nullable();
            $table->decimal('daily_change', 15, 4)->nullable();
            $table->float('percentage_change')->nullable();
            $table->decimal('market_capitalisation', 20, 2)->nullable();
            $table->bigInteger('volume')->nullable();
            $table->bigInteger('shares_outstanding')->nullable();
            $table->decimal('fifty_two_week_high', 15, 4)->nullable();
            $table->decimal('fifty_two_week_low', 15, 4)->nullable();
            $table->date('last_trading_date')->nullable();
            $table->string('last_trading_time')->nullable();
            $table->string('data_source')->nullable();
            $table->timestamp('retrieval_timestamp')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('market_data');
    }
};
