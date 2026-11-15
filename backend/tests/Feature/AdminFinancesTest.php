<?php

namespace Tests\Feature;

use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminFinancesTest extends TestCase
{
    private Plan $rawdha;
    private Plan $noor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->prepareInMemorySchema();

        $this->rawdha = Plan::updateOrCreate(
            ['slug' => 'pro'],
            ['name' => 'Rawdha', 'price_monthly' => 0, 'price_quarterly' => 6500, 'price_yearly' => 25000]
        );

        $this->noor = Plan::updateOrCreate(
            ['slug' => 'max'],
            ['name' => 'Noor', 'price_monthly' => 0, 'price_quarterly' => 8500, 'price_yearly' => 33000]
        );
    }

    private function prepareInMemorySchema(): void
    {
        if (! Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name')->nullable();
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password')->nullable();
                $table->string('role')->default('user');
                $table->string('plan')->default('free');
                $table->json('preferences')->nullable();
                $table->rememberToken();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('plans')) {
            Schema::create('plans', function (Blueprint $table) {
                $table->id();
                $table->string('slug')->unique();
                $table->string('name');
                $table->decimal('price_monthly', 10, 2)->default(0);
                $table->decimal('price_quarterly', 10, 2)->default(0);
                $table->decimal('price_yearly', 10, 2)->default(0);
                $table->json('features')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('subscriptions')) {
            Schema::create('subscriptions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id');
                $table->foreignId('plan_id');
                $table->string('billing_cycle')->nullable();
                $table->string('status')->default('active');
                $table->boolean('auto_renew')->default(false);
                $table->timestamp('renews_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('payment_transactions')) {
            Schema::create('payment_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id');
                $table->foreignId('plan_id');
                $table->string('billing_cycle', 32);
                $table->string('gateway', 32)->default('squad');
                $table->string('transaction_ref')->unique();
                $table->string('gateway_ref')->nullable();
                $table->unsignedBigInteger('amount_kobo');
                $table->string('currency', 10)->default('NGN');
                $table->string('status', 20)->default('pending');
                $table->string('type', 20)->default('initial');
                $table->timestamp('paid_at')->nullable();
                $table->json('raw_payload')->nullable();
                $table->timestamps();
            });
        }
    }

    public function test_non_admin_cannot_access_admin_finances(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'email_verified_at' => now(),
        ]);
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/admin/finances')->assertForbidden();
    }

    public function test_admin_finances_returns_summary_and_filtered_transactions(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
        $alice = User::factory()->create([
            'name' => 'Alice Investor',
            'email' => 'alice@example.com',
            'email_verified_at' => now(),
        ]);
        $bob = User::factory()->create([
            'name' => 'Bob Trader',
            'email' => 'bob@example.com',
            'email_verified_at' => now(),
        ]);

        PaymentTransaction::create([
            'user_id' => $alice->id,
            'plan_id' => $this->rawdha->id,
            'billing_cycle' => 'quarterly',
            'gateway' => 'squad',
            'transaction_ref' => 'IRS_ALICE_001',
            'gateway_ref' => 'SQ_001',
            'amount_kobo' => 650000,
            'currency' => 'NGN',
            'status' => 'success',
            'type' => 'initial',
            'paid_at' => now()->subDays(5),
        ]);

        PaymentTransaction::create([
            'user_id' => $alice->id,
            'plan_id' => $this->noor->id,
            'billing_cycle' => 'yearly',
            'gateway' => 'squad',
            'transaction_ref' => 'IRS_ALICE_002',
            'gateway_ref' => 'SQ_002',
            'amount_kobo' => 3300000,
            'currency' => 'NGN',
            'status' => 'success',
            'type' => 'renewal',
            'paid_at' => now()->subDays(45),
        ]);

        PaymentTransaction::create([
            'user_id' => $bob->id,
            'plan_id' => $this->rawdha->id,
            'billing_cycle' => 'quarterly',
            'gateway' => 'squad',
            'transaction_ref' => 'IRS_BOB_PENDING',
            'amount_kobo' => 650000,
            'currency' => 'NGN',
            'status' => 'pending',
            'type' => 'initial',
        ]);

        PaymentTransaction::create([
            'user_id' => $bob->id,
            'plan_id' => $this->noor->id,
            'billing_cycle' => 'quarterly',
            'gateway' => 'squad',
            'transaction_ref' => 'IRS_BOB_FAILED',
            'amount_kobo' => 850000,
            'currency' => 'NGN',
            'status' => 'failed',
            'type' => 'initial',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/admin/finances');

        $response->assertOk()
            ->assertJsonPath('summary.total_revenue_ngn', 39500)
            ->assertJsonPath('summary.revenue_30d_ngn', 6500)
            ->assertJsonPath('summary.success_count', 2)
            ->assertJsonPath('summary.pending_count', 1)
            ->assertJsonPath('summary.failed_count', 1)
            ->assertJsonPath('summary.total_count', 4)
            ->assertJsonPath('summary.paying_users_count', 1)
            ->assertJsonCount(4, 'transactions.data');

        // Filter by status=pending and search by email
        $filtered = $this->getJson('/api/v1/admin/finances?status=pending&search=bob@example.com');
        $filtered->assertOk()
            ->assertJsonCount(1, 'transactions.data')
            ->assertJsonPath('transactions.data.0.transaction_ref', 'IRS_BOB_PENDING')
            ->assertJsonPath('transactions.data.0.amount_ngn', 6500);

        // Filter by type=renewal
        $renewals = $this->getJson('/api/v1/admin/finances?type=renewal');
        $renewals->assertOk()
            ->assertJsonCount(1, 'transactions.data')
            ->assertJsonPath('transactions.data.0.transaction_ref', 'IRS_ALICE_002');
    }
}
