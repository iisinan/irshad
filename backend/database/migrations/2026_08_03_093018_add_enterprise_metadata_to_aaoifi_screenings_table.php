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
            $table->string('disclosure_id')->nullable()->after('financial_data_used');
            $table->string('pdf_hash')->nullable()->after('disclosure_id');
            $table->integer('reporting_year')->nullable()->after('pdf_hash');
            $table->string('reporting_period')->nullable()->after('reporting_year');
            $table->timestamp('published_date')->nullable()->after('reporting_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aaoifi_screenings', function (Blueprint $table) {
            $table->dropColumn(['disclosure_id', 'pdf_hash', 'reporting_year', 'reporting_period', 'published_date']);
        });
    }
};
