<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    /**
     * Replace legacy Paystack columns with Squad gateway tracking & payment transactions.
     */
    public function up(): void
    {
        // Drop Paystack plan code columns from plans table
        $planPaystackCols = array_values(array_filter([
            Schema::hasColumn('plans', 'paystack_plan_code_monthly') ? 'paystack_plan_code_monthly' : null,
            Schema::hasColumn('plans', 'paystack_plan_code_quarterly') ? 'paystack_plan_code_quarterly' : null,
            Schema::hasColumn('plans', 'paystack_plan_code_yearly') ? 'paystack_plan_code_yearly' : null,
        ]));

        if (!empty($planPaystackCols)) {
            Schema::table('plans', function (Blueprint $table) use ($planPaystackCols) {
                $table->dropColumn($planPaystackCols);
            });
        }

        // Cleanly drop unique index on paystack_subscription_code before dropping columns (SQLite-safe)
        try {
            Schema::table('subscriptions', function (Blueprint $table) {
                $table->dropUnique(['paystack_subscription_code']);
            });
        } catch (\Throwable $e) {
            // Index may already be absent
        }

        $subPaystackCols = array_values(array_filter([
            Schema::hasColumn('subscriptions', 'paystack_subscription_code') ? 'paystack_subscription_code' : null,
            Schema::hasColumn('subscriptions', 'paystack_email_token') ? 'paystack_email_token' : null,
        ]));

        if (!empty($subPaystackCols)) {
            Schema::table('subscriptions', function (Blueprint $table) use ($subPaystackCols) {
                $table->dropColumn($subPaystackCols);
            });
        }

        Schema::table('subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('subscriptions', 'gateway')) {
                $table->string('gateway', 32)->default('squad');
            }
            if (!Schema::hasColumn('subscriptions', 'squad_token_id')) {
                $table->string('squad_token_id')->nullable();
            }
            if (!Schema::hasColumn('subscriptions', 'last_transaction_ref')) {
                $table->string('last_transaction_ref')->nullable();
            }
            if (!Schema::hasColumn('subscriptions', 'auto_renew')) {
                $table->boolean('auto_renew')->default(true);
            }
            if (!Schema::hasColumn('subscriptions', 'notes')) {
                $table->string('notes')->nullable();
            }
        });

        if (!Schema::hasTable('payment_transactions')) {
            Schema::create('payment_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
                $table->string('billing_cycle', 32);
                $table->string('gateway', 32)->default('squad');
                $table->string('transaction_ref')->unique();
                $table->string('gateway_ref')->nullable();
                $table->unsignedBigInteger('amount_kobo');
                $table->string('currency', 10)->default('NGN');
                $table->string('status', 20)->default('pending'); // pending, success, failed
                $table->string('type', 20)->default('initial');   // initial, renewal
                $table->timestamp('paid_at')->nullable();
                $table->json('raw_payload')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');

        $squadCols = array_values(array_filter([
            Schema::hasColumn('subscriptions', 'gateway') ? 'gateway' : null,
            Schema::hasColumn('subscriptions', 'squad_token_id') ? 'squad_token_id' : null,
            Schema::hasColumn('subscriptions', 'last_transaction_ref') ? 'last_transaction_ref' : null,
            Schema::hasColumn('subscriptions', 'auto_renew') ? 'auto_renew' : null,
            Schema::hasColumn('subscriptions', 'notes') ? 'notes' : null,
        ]));

        if (!empty($squadCols)) {
            Schema::table('subscriptions', function (Blueprint $table) use ($squadCols) {
                $table->dropColumn($squadCols);
            });
        }
    }
};
