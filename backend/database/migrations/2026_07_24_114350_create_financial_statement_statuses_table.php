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
        Schema::create('financial_statement_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('company_ticker')->index();
            $table->integer('financial_year');
            $table->enum('status', ['pending', 'available', 'awaiting_report', 'failed'])->default('pending');
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('next_retry_at')->nullable();
            $table->integer('attempt_count')->default(0);
            $table->text('failure_reason')->nullable();
            $table->timestamps();

            // Unique constraint so we only have one status per company per year
            $table->unique(['company_ticker', 'financial_year'], 'company_year_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_statement_statuses');
    }
};
