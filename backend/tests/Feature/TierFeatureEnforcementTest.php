<?php

namespace Tests\Feature;

use App\Models\AaoifiScreening;
use App\Models\Basket;
use App\Models\Company;
use App\Models\Holding;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TierFeatureEnforcementTest extends TestCase
{
    use RefreshDatabase;

    private Plan $freePlan;
    private Plan $proPlan;
    private Plan $maxPlan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PlanSeeder::class);
        $this->freePlan = Plan::where('slug', 'free')->firstOrFail();
        $this->proPlan = Plan::where('slug', 'pro')->firstOrFail();
        $this->maxPlan = Plan::where('slug', 'max')->firstOrFail();
    }

    private function assignPlan(User $user, Plan $plan): void
    {
        Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'billing_cycle' => 'quarterly',
            'status' => 'active',
            'auto_renew' => true,
            'renews_at' => now()->addMonths(3),
            'ends_at' => now()->addMonths(3),
        ]);
        $user->refresh();
    }

    private function createScreenedCompany(string $symbol): Company
    {
        $company = Company::create([
            'symbol' => $symbol,
            'name' => $symbol . ' Plc',
            'sector' => 'Consumer Goods',
            'current_status' => 'halal',
            'latest_price' => 100.0,
            'is_active' => true,
        ]);

        AaoifiScreening::create([
            'company_id' => $company->id,
            'business_status' => 'pass',
            'debt_ratio' => 10.0,
            'debt_status' => 'pass',
            'cash_ratio' => 12.0,
            'cash_status' => 'pass',
            'impermissible_income_ratio' => 2.5,
            'impermissible_income_status' => 'pass',
            'final_status' => 'halal',
        ]);

        return $company;
    }

    public function test_unsubscribed_user_defaults_to_miftah_free_tier(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->assertSame('free', $user->tier->slug);
        $this->assertFalse($user->has_paid_subscription);
    }

    public function test_stock_screens_deduplicates_same_symbol_and_enforces_free_limit_of_3(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        foreach (['MTNN', 'DANGCEM', 'BUAFOODS', 'SEPLAT'] as $sym) {
            $this->createScreenedCompany($sym);
        }

        // Screening MTNN 3 times in a row should only consume 1 monthly credit
        $this->getJson('/api/v1/stocks/MTNN/aaoifi-screening')->assertOk();
        $this->getJson('/api/v1/stocks/MTNN/aaoifi-screening')->assertOk();
        $res1 = $this->getJson('/api/v1/stocks/MTNN/aaoifi-screening')->assertOk();
        $this->assertSame(1, $res1->json('data.screen_usage.used'));

        // Screening 2nd and 3rd unique symbols succeeds
        $this->getJson('/api/v1/stocks/DANGCEM/aaoifi-screening')->assertOk();
        $res3 = $this->getJson('/api/v1/stocks/BUAFOODS/aaoifi-screening')->assertOk();
        $this->assertSame(3, $res3->json('data.screen_usage.used'));

        // Re-visiting an already screened symbol still succeeds even at 3/3
        $this->getJson('/api/v1/stocks/DANGCEM/aaoifi-screening')->assertOk();

        // Screening a 4th unique symbol on Free fails with 403
        $this->getJson('/api/v1/stocks/SEPLAT/aaoifi-screening')
            ->assertStatus(403)
            ->assertJson([
                'upgrade_required' => true,
                'feature' => 'stock_screens_per_month',
                'required_tier' => 'pro',
            ]);
    }

    public function test_portfolio_limit_enforces_3_on_free_and_7_on_pro(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        foreach (['S1', 'S2', 'S3'] as $sym) {
            $this->postJson('/api/v1/portfolio', [
                'symbol' => $sym,
                'shares' => 10,
                'average_buy_price' => 50,
            ])->assertOk();
        }

        // 4th stock blocked on Free
        $this->postJson('/api/v1/portfolio', [
            'symbol' => 'S4',
            'shares' => 10,
            'average_buy_price' => 50,
        ])->assertStatus(403)->assertJson([
            'upgrade_required' => true,
            'feature' => 'portfolio_limit',
        ]);

        // Upgrade to Pro (limit 7) -> 4th stock now succeeds
        $this->assignPlan($user, $this->proPlan);
        $this->postJson('/api/v1/portfolio', [
            'symbol' => 'S4',
            'shares' => 10,
            'average_buy_price' => 50,
        ])->assertOk();
    }

    public function test_watchlist_locked_on_free_limited_to_2_on_pro_and_unlimited_on_max(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        // Locked on Free (0)
        $this->postJson('/api/v1/watchlist', ['symbol' => 'MTNN'])
            ->assertStatus(403)
            ->assertJson(['upgrade_required' => true, 'feature' => 'watchlist_limit']);

        // Onboard endpoint also enforces watchlist limit on Free
        $this->postJson('/api/v1/onboard', ['symbols' => ['MTNN']])
            ->assertStatus(403);

        // Upgrade to Pro (limit 2)
        $this->assignPlan($user, $this->proPlan);
        $this->postJson('/api/v1/watchlist', ['symbol' => 'MTNN'])->assertCreated();
        $this->postJson('/api/v1/watchlist', ['symbol' => 'DANGCEM'])->assertCreated();
        $this->postJson('/api/v1/watchlist', ['symbol' => 'SEPLAT'])
            ->assertStatus(403)
            ->assertJson(['upgrade_required' => true, 'required_tier' => 'max']);
    }

    public function test_purification_zakat_and_statements_enforced_by_tier(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        Holding::create([
            'user_id' => $user->id,
            'symbol' => 'MTNN',
            'shares' => 100,
            'average_buy_price' => 200,
        ]);

        // Free user sees tier_locks = true on portfolio index
        $portfolioFree = $this->getJson('/api/v1/portfolio')->assertOk();
        $this->assertTrue($portfolioFree->json('data.tier_locks.purification_locked'));
        $this->assertTrue($portfolioFree->json('data.tier_locks.statements_locked'));
        $this->assertTrue($portfolioFree->json('data.tier_locks.zakat_locked'));
        $this->assertTrue($portfolioFree->json('data.tier_locks.drift_tracking_locked'));

        // Free user blocked from purify, zakat calculate, and statement Hawl sync
        $this->postJson('/api/v1/portfolio/purify', ['all' => true])->assertStatus(403);
        $this->postJson('/api/v1/zakat/calculate', ['cash_savings' => 50000000])->assertStatus(403);
        $this->putJson('/api/v1/profile', ['preferences' => ['zakat_hawl_date' => '2026-01-01']])->assertStatus(403);

        // Upgrade to Pro -> unlocks Purification (2/mo), Zakat, and Statements, while Monthly Spotlight remains Max-only
        $this->assignPlan($user, $this->proPlan);

        $portfolioPro = $this->getJson('/api/v1/portfolio')->assertOk();
        $this->assertFalse($portfolioPro->json('data.tier_locks.purification_locked'));
        $this->assertFalse($portfolioPro->json('data.tier_locks.statements_locked'));
        $this->assertFalse($portfolioPro->json('data.tier_locks.zakat_locked'));
        $this->assertTrue($portfolioPro->json('data.tier_locks.drift_tracking_locked'));

        $this->postJson('/api/v1/zakat/calculate', ['cash_savings' => 50000000])->assertOk();
        $this->putJson('/api/v1/profile', ['preferences' => ['zakat_hawl_date' => '2026-01-01']])->assertOk();

        // Monthly Spotlight blocked on Pro, unlocked on Max
        $this->getJson('/api/v1/updates/monthly-spotlight')->assertStatus(403);

        $this->assignPlan($user, $this->maxPlan);
        $this->getJson('/api/v1/updates/monthly-spotlight')
            ->assertOk()
            ->assertJsonStructure(['status', 'data' => ['month', 'top_halal_gainers', 'ratio_health_leaders']]);
    }

    public function test_thematic_baskets_enforced_across_free_pro_and_max(): void
    {
        for ($i = 1; $i <= 4; $i++) {
            Basket::create([
                'user_id' => null,
                'name' => "Curated Basket {$i}",
                'description' => 'Test curated basket',
                'category' => 'Thematic',
                'symbols' => ['MTNN', 'DANGCEM'],
                'is_active' => true,
            ]);
        }

        $baskets = Basket::whereNull('user_id')->orderBy('id')->get();
        $firstBasket = $baskets->first();
        $fourthBasket = $baskets->last();

        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        // Free user: all curated baskets marked is_locked = true and show() returns 403
        $indexFree = $this->getJson('/api/v1/stocks/baskets')->assertOk();
        $this->assertTrue($indexFree->json('data.0.is_locked'));
        $this->getJson("/api/v1/stocks/baskets/{$firstBasket->id}")->assertStatus(403);

        // Pro user: first 3 curated baskets unlocked, 4th curated basket locked (requires max)
        $this->assignPlan($user, $this->proPlan);
        $indexPro = $this->getJson('/api/v1/stocks/baskets')->assertOk();
        $this->assertFalse($indexPro->json('data.0.is_locked'));
        $this->assertTrue($indexPro->json('data.3.is_locked'));
        $this->getJson("/api/v1/stocks/baskets/{$firstBasket->id}")->assertOk();
        $this->getJson("/api/v1/stocks/baskets/{$fourthBasket->id}")->assertStatus(403);

        // Max user: all curated baskets unlocked
        $this->assignPlan($user, $this->maxPlan);
        $this->getJson("/api/v1/stocks/baskets/{$fourthBasket->id}")->assertOk();
    }

    public function test_watchlist_compliance_risk_alert_requires_max_drift_tracking(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        // Pro user adds MTNN with alert_compliance_risk = true -> backend forces false
        $this->assignPlan($user, $this->proPlan);
        $proRes = $this->postJson('/api/v1/watchlist', [
            'symbol' => 'MTNN',
            'alert_inapp' => true,
            'alert_compliance_risk' => true,
        ])->assertCreated();

        $this->assertFalse((bool) $proRes->json('data.alert_compliance_risk'));

        // Max user enables alert_compliance_risk -> persists as true
        $this->assignPlan($user, $this->maxPlan);
        $maxRes = $this->putJson('/api/v1/watchlist/MTNN', [
            'alert_compliance_risk' => true,
        ])->assertOk();

        $this->assertTrue((bool) $maxRes->json('data.alert_compliance_risk'));
    }

    public function test_past_due_grace_period_preserves_access_until_ends_at_and_transactions_endpoint_works(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        $sub = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $this->proPlan->id,
            'billing_cycle' => 'quarterly',
            'status' => 'past_due',
            'auto_renew' => true,
            'renews_at' => now()->subDay(),
            'ends_at' => now()->addDays(2),
        ]);

        // Within 3-day dunning grace window, user keeps Pro tier
        $this->assertEquals('pro', $user->fresh()->tier->slug);

        // Once grace window expires, user falls back to Free tier
        $sub->update(['ends_at' => now()->subMinute()]);
        $this->assertEquals('free', $user->fresh()->tier->slug);

        PaymentTransaction::create([
            'user_id' => $user->id,
            'plan_id' => $this->proPlan->id,
            'billing_cycle' => 'quarterly',
            'gateway' => 'squad',
            'transaction_ref' => 'TEST_TX_12345',
            'amount_kobo' => 650000,
            'currency' => 'NGN',
            'status' => 'success',
            'type' => 'initial',
            'paid_at' => now(),
        ]);

        $this->getJson('/api/v1/subscription/transactions')
            ->assertOk()
            ->assertJsonPath('transactions.0.transaction_ref', 'TEST_TX_12345')
            ->assertJsonPath('transactions.0.plan_slug', 'pro');
    }
}
