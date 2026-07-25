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
        Schema::create('annual_report_pdfs', function (Blueprint $table) {
            $table->id();
            $table->string('company_ticker');
            $table->integer('financial_year');
            $table->string('sha256_hash')->unique();
            $table->string('storage_url');
            $table->string('original_url', 500);
            $table->integer('pages')->nullable();
            $table->integer('file_size')->nullable();
            $table->string('language')->default('en');
            $table->string('report_type')->default('Audited Annual Report');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('annual_report_pdfs');
    }
};
