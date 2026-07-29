<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('category'); // compliance, screening, market_intelligence, earnings, dividend, aaoifi
            $table->text('content')->nullable();
            $table->string('source')->nullable();
            $table->string('source_url')->nullable();
            $table->string('image_url')->nullable();
            $table->timestamp('published_at');
            $table->timestamps();

            $table->index(['category', 'published_at']);
            $table->index(['company_id', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_articles');
    }
};
