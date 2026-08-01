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
        Schema::create('dividends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('ticker')->index();
            $table->decimal('amount', 12, 4);
            $table->string('currency', 10)->default('NGN');
            $table->string('dividend_type')->nullable(); // Final, Interim, etc
            $table->date('ex_date')->nullable();
            $table->date('record_date')->nullable();
            $table->date('pay_date')->nullable();
            $table->string('status')->default('tbd'); // upcoming, paid, tbd
            $table->decimal('yield', 8, 4)->nullable();
            $table->timestamps();

            // Unique constraint to prevent duplicates for the same dividend event
            $table->unique(['ticker', 'ex_date', 'dividend_type', 'amount'], 'unique_dividend_event');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dividends');
    }
};
