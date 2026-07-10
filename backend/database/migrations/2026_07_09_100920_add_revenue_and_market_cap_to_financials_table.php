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
            $table->decimal('total_revenue', 20, 2)->default(0)->after('total_debt');
            $table->decimal('market_cap', 20, 2)->default(0)->after('total_revenue');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financials', function (Blueprint $table) {
            $table->dropColumn(['total_revenue', 'market_cap']);
        });
    }
};
