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
            $table->decimal('cash_and_equivalents', 20, 2)->nullable()->after('total_debt');
            $table->decimal('interest_bearing_securities', 20, 2)->nullable()->after('cash_and_equivalents');
            $table->decimal('accounts_receivable', 20, 2)->nullable()->after('interest_bearing_securities');
            $table->decimal('illiquid_assets', 20, 2)->nullable()->after('accounts_receivable');
        });

        Schema::table('aaoifi_screenings', function (Blueprint $table) {
            $table->decimal('illiquid_ratio', 10, 4)->nullable()->after('impermissible_income_status');
            $table->string('illiquid_status')->nullable()->after('illiquid_ratio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financials_and_screenings', function (Blueprint $table) {
            //
        });
    }
};
