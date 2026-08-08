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
            $table->dropColumn(['accounts_receivable', 'illiquid_assets']);
        });

        Schema::table('aaoifi_screenings', function (Blueprint $table) {
            $table->dropColumn([
                'illiquid_ratio',
                'illiquid_status',
                'receivables_ratio',
                'receivables_status'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financials', function (Blueprint $table) {
            $table->decimal('accounts_receivable', 20, 2)->nullable();
            $table->decimal('illiquid_assets', 20, 2)->nullable();
        });

        Schema::table('aaoifi_screenings', function (Blueprint $table) {
            $table->decimal('illiquid_ratio', 8, 4)->nullable();
            $table->string('illiquid_status')->nullable();
            $table->decimal('receivables_ratio', 8, 4)->nullable();
            $table->string('receivables_status')->nullable();
        });
    }
};
