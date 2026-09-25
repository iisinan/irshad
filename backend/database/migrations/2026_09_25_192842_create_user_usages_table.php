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
        Schema::create('user_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('feature'); // e.g., 'stock_screens', 'purifications'
            $table->integer('used_count')->default(0);
            $table->timestamp('reset_at')->nullable(); // When this usage count should be reset (usually start of next month)
            $table->timestamps();
            
            $table->unique(['user_id', 'feature']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_usages');
    }
};
