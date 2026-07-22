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
        Schema::table('aaoifi_screenings', function (Blueprint $table) {
            $table->decimal('receivables_ratio', 10, 4)->nullable()->after('illiquid_status');
            $table->string('receivables_status')->nullable()->after('receivables_ratio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aaoifi_screenings', function (Blueprint $table) {
            $table->dropColumn(['receivables_ratio', 'receivables_status']);
        });
    }
};
