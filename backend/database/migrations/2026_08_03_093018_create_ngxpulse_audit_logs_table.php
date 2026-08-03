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
        Schema::create('ngxpulse_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('disclosure_id')->nullable();
            $table->string('source_url', 1000)->nullable();
            $table->string('pdf_hash')->nullable();
            $table->string('status'); // success, failed, skipped, review
            $table->text('reason')->nullable();
            $table->float('processing_duration')->nullable(); // seconds
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ngxpulse_audit_logs');
    }
};
