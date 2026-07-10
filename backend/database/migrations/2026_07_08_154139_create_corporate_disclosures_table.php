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
        Schema::create('corporate_disclosures', function (Blueprint $table) {
            $table->id();
            $table->string('company_symbol')->index();
            $table->string('company_name')->nullable();
            $table->text('title');
            $table->string('pdf_url')->nullable();
            $table->string('submission_type')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('corporate_disclosures');
    }
};
