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
        Schema::create('business_screenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('ticker')->index();
            $table->text('business_summary')->nullable();
            $table->text('current_core_business')->nullable();
            $table->json('detected_business_activities')->nullable();
            $table->json('detected_prohibited_activities')->nullable();
            $table->json('supporting_evidence')->nullable();
            $table->json('source_urls')->nullable();
            $table->json('source_publication_dates')->nullable();
            $table->text('ai_explanation')->nullable();
            $table->float('confidence_score')->default(0.0);
            $table->string('business_compliance_status')->nullable(); // Halal, Questionable, Non-Compliant
            $table->timestamp('last_analysed_timestamp')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_screenings');
    }
};
