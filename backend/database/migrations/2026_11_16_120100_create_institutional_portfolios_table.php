<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('institutional_portfolios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('fund_code')->nullable();
            $table->string('benchmark')->nullable();
            $table->string('currency', 10)->default('NGN');
            $table->json('holdings_payload');
            $table->json('summary_snapshot')->nullable();
            $table->json('factsheet_meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('institutional_portfolios');
    }
};
