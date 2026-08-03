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
        Schema::create('financial_review_queue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('disclosure_id')->nullable();
            $table->string('source_url', 1000);
            $table->json('extracted_data')->nullable(); // the raw json from Gemini
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->text('review_reason'); // e.g. "Assets < 0", "Low Confidence"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_review_queue');
    }
};
