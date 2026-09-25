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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $table->enum('billing_cycle', ['monthly', 'yearly'])->default('monthly');
            $table->string('paystack_subscription_code')->nullable()->unique();
            $table->string('paystack_email_token')->nullable(); // For webhooks/management
            $table->string('status')->default('active'); // active, past_due, canceled
            $table->timestamp('renews_at')->nullable();
            $table->timestamp('ends_at')->nullable(); // Set if canceled
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
