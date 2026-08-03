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
        Schema::table('brokerage_accounts', function (Blueprint $table) {
            $table->decimal('cash_balance', 15, 2)->default(0.00)->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('brokerage_accounts', function (Blueprint $table) {
            $table->dropColumn('cash_balance');
        });
    }
};
