<?php

namespace Tests\Feature;

use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
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

        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('location')->nullable();
            $table->string('role')->default('user');
            $table->string('plan')->default('free');
            $table->json('preferences')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->decimal('price_monthly', 10, 2)->default(0);
            $table->decimal('price_quarterly', 10, 2)->default(0);
            $table->decimal('price_yearly', 10, 2)->default(0);
            $table->json('features')->nullable();
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $table->string('billing_cycle')->default('quarterly');
            $table->string('gateway')->default('squad');
            $table->string('squad_token_id')->nullable();
            $table->string('last_transaction_ref')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->text('notes')->nullable();
            $table->string('status')->default('active');
            $table->timestamp('renews_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $table->string('billing_cycle', 30);
            $table->string('gateway', 30)->default('squad');
            $table->string('transaction_ref')->unique();
            $table->string('gateway_ref')->nullable();
            $table->unsignedBigInteger('amount_kobo');
            $table->string('currency', 10)->default('NGN');
            $table->string('status', 30)->default('pending');
            $table->string('type', 30)->default('initial');
            $table->timestamp('paid_at')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();
        });

        Config::set('services.squad.secret', 'sandbox_sk_test_secret');
        Config::set('services.squad.public', 'sandbox_pk_test_public');
        Config::set('services.squad.base_url', 'https://sandbox-api-d.squadco.com');

        $this->rawdha = Plan::updateOrCreate(
            ['slug' => 'pro'],
            ['name' => 'Rawdha', 'price_monthly' => 0, 'price_quarterly' => 6500, 'price_yearly' => 25000]
        );

        $this->noor = Plan::updateOrCreate(
            ['slug' => 'max'],
            ['name' => 'Noor', 'price_monthly' => 0, 'price_quarterly' => 8500, 'price_yearly' => 33000]
        );
    }

    public function test_non_admin_cannot_access_admin_finances(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'email_verified_at' => now(),
        ]);
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/admin/finances')->assertForbidden();
        $this->get('/api/v1/admin/finances/export')->assertForbidden();
    }

    public function test_admin_finances_returns_summary_charts_and_filters(): void
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

        Subscription::create([
            'user_id' => $alice->id,
            'plan_id' => $this->rawdha->id,
            'billing_cycle' => 'quarterly',
            'gateway' => 'squad',
            'status' => 'active',
            'renews_at' => now()->addMonths(3),
        ]);

        Subscription::create([
            'user_id' => $bob->id,
            'plan_id' => $this->noor->id,
            'billing_cycle' => 'yearly',
            'gateway' => 'admin_override',
            'status' => 'active',
            'renews_at' => now()->addYear(),
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
            ->assertJsonPath('summary.avg_ticket_ngn', 19750)
            ->assertJsonPath('summary.success_rate', 50)
            ->assertJsonPath('summary.success_count', 2)
            ->assertJsonPath('summary.pending_count', 1)
            ->assertJsonPath('summary.failed_count', 1)
            ->assertJsonPath('summary.total_count', 4)
            ->assertJsonPath('summary.paying_users_count', 1)
            ->assertJsonPath('summary.active_paid_subs', 1)
            ->assertJsonPath('summary.active_admin_overrides', 1)
            ->assertJsonCount(6, 'charts.monthly_revenue')
            ->assertJsonCount(2, 'charts.by_plan')
            ->assertJsonCount(2, 'charts.by_cycle')
            ->assertJsonCount(4, 'transactions.data');

        // Filter by plan=max & billing_cycle=yearly
        $planFiltered = $this->getJson('/api/v1/admin/finances?plan=max&billing_cycle=yearly');
        $planFiltered->assertOk()
            ->assertJsonPath('filtered_totals.count', 1)
            ->assertJsonPath('filtered_totals.success_revenue_ngn', 33000)
            ->assertJsonPath('transactions.data.0.transaction_ref', 'IRS_ALICE_002');

        // Export CSV with status=success filter
        $export = $this->get('/api/v1/admin/finances/export?status=success');
        $export->assertOk();
        $csv = $export->streamedContent();
        $this->assertStringContainsString('IRS_ALICE_001', $csv);
        $this->assertStringContainsString('IRS_ALICE_002', $csv);
        $this->assertStringNotContainsString('IRS_BOB_PENDING', $csv);
    }

    public function test_admin_can_verify_pending_squad_transaction_and_activate_subscription(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
        $customer = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $tx = PaymentTransaction::create([
            'user_id' => $customer->id,
            'plan_id' => $this->rawdha->id,
            'billing_cycle' => 'quarterly',
            'gateway' => 'squad',
            'transaction_ref' => 'IRS_RECONCILE_01',
            'amount_kobo' => 650000,
            'currency' => 'NGN',
            'status' => 'pending',
            'type' => 'initial',
        ]);

        Http::fake([
            'https://sandbox-api-d.squadco.com/transaction/verify/IRS_RECONCILE_01' => Http::response([
                'status'  => 200,
                'success' => true,
                'data'    => [
                    'transaction_status' => 'Success',
                    'transaction_amount' => 650000,
                    'gateway_ref'        => 'SQ_GW_999',
                    'token_id'           => 'tok_reconciled',
                ],
            ], 200),
        ]);

        Sanctum::actingAs($admin);

        $res = $this->postJson("/api/v1/admin/finances/{$tx->id}/verify");
        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('transaction.status', 'success')
            ->assertJsonPath('subscription.status', 'active');

        $this->assertDatabaseHas('payment_transactions', [
            'id' => $tx->id,
            'status' => 'success',
            'gateway_ref' => 'SQ_GW_999',
        ]);

        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $customer->id,
            'plan_id' => $this->rawdha->id,
            'status' => 'active',
        ]);
    }
}
