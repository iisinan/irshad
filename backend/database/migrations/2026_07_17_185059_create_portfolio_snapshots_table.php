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
        Schema::create('portfolio_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('total_balance', 15, 2)->default(0);
            $table->decimal('cash_balance', 15, 2)->default(0);
            $table->decimal('stocks_balance', 15, 2)->default(0);
            $table->decimal('halal_value', 15, 2)->default(0);
            $table->decimal('health_percentage', 5, 2)->default(100);
            $table->date('date');
            $table->timestamps();

            // A user should only have one snapshot per day
            $table->unique(['user_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('portfolio_snapshots');
    }
};
