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
            $table->text('source_url')->nullable();
            $table->date('published_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financials', function (Blueprint $table) {
            $table->dropColumn(['source_url', 'published_date']);
        });
    }
};
