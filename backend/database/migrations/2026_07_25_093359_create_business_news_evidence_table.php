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
        Schema::create('business_news_evidence', function (Blueprint $table) {
            $table->id();
            $table->string('company_ticker');
            $table->string('headline', 500);
            $table->text('summary');
            $table->string('source');
            $table->string('author')->nullable();
            $table->string('original_url', 500)->nullable();
            $table->string('evidence_hash')->unique();
            $table->string('category');
            $table->integer('confidence');
            $table->text('ai_summary')->nullable();
            $table->timestamp('published_date')->nullable();
            $table->timestamp('retrieved_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_news_evidence');
    }
};
