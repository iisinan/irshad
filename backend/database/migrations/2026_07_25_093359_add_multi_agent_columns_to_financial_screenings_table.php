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
            $table->string('workflow_version')->default('1.0');
            $table->json('confidence_breakdown')->nullable();
            $table->boolean('requires_manual_review')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_screenings', function (Blueprint $table) {
            //
        });
    }
};
