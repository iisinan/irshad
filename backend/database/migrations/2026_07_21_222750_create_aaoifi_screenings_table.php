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
        Schema::create('aaoifi_screenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            
            // Business Activity Screening
            $table->string('business_status'); // pass, fail, warning
            $table->json('business_reasoning')->nullable(); // AI structured response
            
            // Debt Ratio Screening
            $table->decimal('debt_ratio', 8, 4)->nullable(); // e.g. 18.4200
            $table->string('debt_status')->nullable();
            
            // Cash & Interest-bearing Securities Screening
            $table->decimal('cash_ratio', 8, 4)->nullable();
            $table->string('cash_status')->nullable();
            
            // Impermissible Income Screening
            $table->decimal('impermissible_income_ratio', 8, 4)->nullable();
            $table->string('impermissible_income_status')->nullable();
            
            // Final Decision
            $table->string('final_status'); // compliant, non-compliant, doubtful
            
            // Evidence & Traceability
            $table->json('news_sources')->nullable();
            $table->json('financial_data_used')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aaoifi_screenings');
    }
};
