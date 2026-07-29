<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_activity_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('activity_type'); // acquisition, new_business, disposal, prohibited_activity, islamic_finance, regulatory
            $table->text('summary');
            $table->string('source')->nullable();
            $table->string('source_url')->nullable();
            $table->string('confidence_level')->default('medium'); // low, medium, high
            $table->decimal('confidence_score', 5, 2)->nullable(); // 0-100
            $table->timestamp('date_detected');
            $table->timestamps();

            $table->index(['company_id', 'date_detected']);
            $table->index(['activity_type', 'date_detected']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_activity_updates');
    }
};
