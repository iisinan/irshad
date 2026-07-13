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
        Schema::table('financials', function (Blueprint $table) {
            $table->decimal('eps', 10, 2)->nullable();
            $table->decimal('pe_ratio', 10, 2)->nullable();
            $table->decimal('roe', 10, 2)->nullable();
            $table->decimal('dividend_yield', 10, 2)->nullable();
            $table->decimal('profit_margin', 10, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financials', function (Blueprint $table) {
            $table->dropColumn(['eps', 'pe_ratio', 'roe', 'dividend_yield', 'profit_margin']);
        });
    }
};
