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
            $table->bigInteger('shares_outstanding')->nullable()->after('market_cap');
            $table->decimal('52w_high', 10, 2)->nullable()->after('shares_outstanding');
            $table->decimal('52w_low', 10, 2)->nullable()->after('52w_high');
            $table->bigInteger('volume_today')->nullable()->after('52w_low');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['shares_outstanding', '52w_high', '52w_low', 'volume_today']);
        });
    }
};
