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
            $table->text('overview')->nullable();
            $table->decimal('analysts_target', 10, 2)->nullable();
            $table->string('valuation_info')->nullable();
            $table->string('growth_info')->nullable();
            $table->decimal('div_yield', 5, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['overview', 'analysts_target', 'valuation_info', 'growth_info', 'div_yield']);
        });
    }
};
