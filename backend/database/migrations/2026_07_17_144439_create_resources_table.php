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
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('scholar')->nullable();
            $table->enum('type', ['video', 'document'])->default('video');
            $table->string('duration')->nullable();
            $table->string('thumbnail')->nullable();
            $table->string('url');
            $table->string('category')->default('General');
            $table->string('external_id')->nullable()->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resources');
    }
};
