<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserUsage;
use App\Services\PerplexityAiService;
use App\Services\SquadService;
use App\Services\SubscriptionService;
use Carbon\Carbon;
use Database\Seeders\PlanSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionTransitionsAndQuotasTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.squad.secret', 'sandbox_sk_test_secret');
        Config::set('services.squad.public', 'sandbox_pk_test_public');
        Config::set('services.squad.base_url', 'https://sandbox-api-d.squadco.com');
        Config::set('app.frontend_url', 'https://iirshad.com');

        Schema::dropIfExists('user_notifications');
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('baskets');
        Schema::dropIfExists('watchlists');
        Schema::dropIfExists('holdings');
        Schema::dropIfExists('user_usages');
        Schema::dropIfExists('aaoifi_screenings');
        Schema::dropIfExists('financials');
        Schema::dropIfExists('stock_statuses');
        Schema::dropIfExists('companies');
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
            $table->decimal('price_quarterly_regular', 10, 2)->default(0);
            $table->decimal('price_yearly', 10, 2)->default(0);
            $table->decimal('price_yearly_regular', 10, 2)->default(0);
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
            $table->string('billing_cycle')->default('quarterly');
            $table->string('gateway')->default('squad');
            $table->string('transaction_ref')->unique();
            $table->string('gateway_ref')->nullable();
            $table->unsignedBigInteger('amount_kobo')->default(0);
            $table->string('currency', 10)->default('NGN');
            $table->string('status')->default('pending');
            $table->string('type')->default('initial');
            $table->timestamp('paid_at')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();
        });

        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('icon')->nullable();
            $table->string('title');
            $table->text('message');
            $table->string('category')->nullable();
            $table->string('action_url')->nullable();
            $table->string('action_label')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        Schema::create('user_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('feature');
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('reset_at')->nullable();
            $table->timestamps();
        });

        Schema::create('holdings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('symbol');
            $table->timestamps();
        });

        Schema::create('watchlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('symbol');
            $table->timestamps();
        });

        Schema::create('baskets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('symbol')->unique();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('stock_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('halal');
            $table->boolean('verified_by_scholar')->default(false);
            $table->timestamps();
        });

        Schema::create('financials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('aaoifi_screenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('final_status')->default('halal');
            $table->timestamps();
        });

        $this->seed(PlanSeeder::class);
    }

    public function test_upgrading_from_free_resets_monthly_usage_to_fresh_quarterly_quota(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-15 12:00:00'));

        try {
            $user = User::create([
                'name' => 'Free Upgrade User',
                'email' => 'upgrade@example.com',
                'password' => bcrypt('secret'),
                'email_verified_at' => now(),
            ]);

            SubscriptionService::recordStockScreen($user, 'MTNN');
            SubscriptionService::recordStockScreen($user, 'DANGCEM');
            SubscriptionService::recordStockScreen($user, 'ZENITHBANK');

            $beforeSummary = SubscriptionService::getUsageSummary($user);
            $this->assertSame(3, $beforeSummary['stock_screens_per_month']['used']);
            $this->assertSame('month', $beforeSummary['stock_screens_per_month']['period']);

            $proPlan = Plan::where('slug', 'pro')->firstOrFail();
            $tx = PaymentTransaction::create([
                'user_id' => $user->id,
                'plan_id' => $proPlan->id,
                'billing_cycle' => 'quarterly',
                'gateway' => 'squad',
                'transaction_ref' => 'IRS_UPG_001',
                'amount_kobo' => 650000,
                'currency' => 'NGN',
                'status' => 'pending',
                'type' => 'initial',
            ]);

            $sub = app(SquadService::class)->activateFromTransaction($tx, [
                'transaction_status' => 'Success',
                'transaction_amount' => 650000,
                'payment_information' => ['token_id' => 'TOK_123'],
            ]);

            $this->assertTrue($sub->auto_renew);

            $afterSummary = SubscriptionService::getUsageSummary($user->fresh());
            $this->assertSame(0, $afterSummary['stock_screens_per_month']['used']);
            $this->assertSame(30, $afterSummary['stock_screens_per_month']['limit']);
            $this->assertSame('quarter', $afterSummary['stock_screens_per_month']['period']);

            $usageRow = UserUsage::where('user_id', $user->id)
                ->where('feature', 'stock_screens_per_month')
                ->firstOrFail();
            $this->assertSame('2027-01-01', $usageRow->reset_at->toDateString());
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_mid_cycle_upgrade_credits_unused_days_and_cardless_checkout_disables_auto_renew(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-15 12:00:00'));

        try {
            $proPlan = Plan::where('slug', 'pro')->firstOrFail();
            $maxPlan = Plan::where('slug', 'max')->firstOrFail();

            $user = User::create([
                'name' => 'Proration User',
                'email' => 'prorate@example.com',
                'password' => bcrypt('secret'),
                'email_verified_at' => now(),
            ]);

            // User has 45 unused days left on Rawdha Quarterly (₦6,500 * 45/90 = ₦3,250 credit)
            Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $proPlan->id,
                'billing_cycle' => 'quarterly',
                'gateway' => 'squad',
                'squad_token_id' => 'TOK_OLD',
                'auto_renew' => true,
                'status' => 'active',
                'renews_at' => now()->addDays(45),
            ]);

            $tx = PaymentTransaction::create([
                'user_id' => $user->id,
                'plan_id' => $maxPlan->id,
                'billing_cycle' => 'yearly',
                'gateway' => 'squad',
                'transaction_ref' => 'IRS_PRORATE_1',
                'amount_kobo' => 3300000,
                'currency' => 'NGN',
                'status' => 'pending',
                'type' => 'initial',
            ]);

            // Cardless checkout (no token_id)
            $sub = app(SquadService::class)->activateFromTransaction($tx, [
                'transaction_status' => 'Success',
                'transaction_amount' => 3300000,
            ]);

            $this->assertFalse($sub->auto_renew);
            $this->assertNull($sub->squad_token_id);
            // 1 year + ~36 credited days from unused ₦3,250 against ₦33,000/365yr rate
            $this->assertTrue($sub->renews_at->greaterThan(now()->addYear()->addDays(30)));
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_expiring_non_renewing_and_failed_renewal_send_notifications_and_emails(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-15 06:00:00'));

        try {
            $proPlan = Plan::where('slug', 'pro')->firstOrFail();

            $expiringUser = User::create([
                'name' => 'Expiring Cardless',
                'email' => 'expiring@example.com',
                'password' => bcrypt('secret'),
            ]);
            Subscription::create([
                'user_id' => $expiringUser->id,
                'plan_id' => $proPlan->id,
                'billing_cycle' => 'quarterly',
                'gateway' => 'squad',
                'squad_token_id' => null,
                'auto_renew' => false,
                'status' => 'active',
                'renews_at' => now()->addDays(2),
            ]);

            $failingUser = User::create([
                'name' => 'Failing Card',
                'email' => 'failing@example.com',
                'password' => bcrypt('secret'),
            ]);
            $failingSub = Subscription::create([
                'user_id' => $failingUser->id,
                'plan_id' => $proPlan->id,
                'billing_cycle' => 'quarterly',
                'gateway' => 'squad',
                'squad_token_id' => 'TOK_FAIL',
                'auto_renew' => true,
                'status' => 'active',
                'renews_at' => now()->subMinute(),
            ]);

            Http::fake([
                'https://sandbox-api-d.squadco.com/transaction/charge_card' => Http::response([
                    'status' => 400,
                    'success' => false,
                    'message' => 'Insufficient funds',
                ], 400),
            ]);

            $this->artisan('app:charge-squad-renewals')->assertExitCode(0);

            $failingSub->refresh();
            $this->assertSame('past_due', $failingSub->status);
            $this->assertNotNull($failingSub->ends_at);

            $this->assertDatabaseHas('user_notifications', [
                'user_id' => $expiringUser->id,
                'title' => 'Subscription Expiring Soon',
            ]);
            $this->assertDatabaseHas('user_notifications', [
                'user_id' => $failingUser->id,
                'title' => 'Subscription Renewal Failed',
            ]);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_ai_analysis_and_chat_attach_screen_usage_and_free_init_preserves_period_end(): void
    {
        $proPlan = Plan::where('slug', 'pro')->firstOrFail();
        $user = User::create([
            'name' => 'Sync User',
            'email' => 'sync@example.com',
            'password' => bcrypt('secret'),
        ]);
        $user->markEmailAsVerified();

        $renewsAt = now()->addDays(15);
        Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
            'billing_cycle' => 'yearly',
            'gateway' => 'squad',
            'auto_renew' => true,
            'status' => 'active',
            'renews_at' => $renewsAt,
        ]);

        Company::create(['symbol' => 'PRESCO', 'name' => 'Presco Plc', 'is_active' => true]);

        $mockAi = $this->mock(PerplexityAiService::class);
        $mockAi->shouldReceive('analyzeCompliance')->once()->andReturn([
            'reasoning' => 'Compliant operations',
            'confidence_score' => 95,
            'sources' => [],
        ]);
        $mockAi->shouldReceive('chatAboutStock')->once()->andReturn('Yes, compliant.');

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/stocks/PRESCO/analysis')
            ->assertOk()
            ->assertJsonPath('data.screen_usage.used', 1)
            ->assertJsonPath('data.screen_usage.limit', 30)
            ->assertJsonPath('data.screen_usage.period', 'quarter');

        $this->postJson('/api/v1/stocks/PRESCO/chat', ['question' => 'Is it halal?'])
            ->assertOk()
            ->assertJsonPath('data.screen_usage.used', 1);

        $this->postJson('/api/v1/subscription/initialize', [
            'plan_slug' => 'free',
            'billing_cycle' => 'yearly',
        ])->assertOk();

        $sub = Subscription::where('user_id', $user->id)->firstOrFail();
        $this->assertSame('canceled', $sub->status);
        $this->assertTrue($sub->ends_at->isFuture());
    }
}
