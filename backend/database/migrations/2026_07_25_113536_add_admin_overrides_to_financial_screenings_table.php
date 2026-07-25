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
        Schema::table('financial_screenings', function (Blueprint $table) {
            $table->boolean('is_manual_override')->default(false)->after('requires_manual_review');
            $table->text('evidence_link')->nullable()->after('is_manual_override');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_screenings', function (Blueprint $table) {
            $table->dropColumn(['is_manual_override', 'evidence_link']);
        });
    }
};
