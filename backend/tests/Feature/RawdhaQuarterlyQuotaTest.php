<?php

namespace Tests\Feature;

use App\Models\AaoifiScreening;
use App\Models\Company;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserUsage;
use App\Services\SubscriptionService;
use Carbon\Carbon;
use Database\Seeders\PlanSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RawdhaQuarterlyQuotaTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('financials');
        Schema::dropIfExists('stock_statuses');
        Schema::dropIfExists('baskets');
        Schema::dropIfExists('watchlists');
        Schema::dropIfExists('holdings');
        Schema::dropIfExists('user_usages');
        Schema::dropIfExists('aaoifi_screenings');
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

        Schema::create('user_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('feature');
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('reset_at')->nullable();
            $table->timestamps();
        });

        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('symbol')->unique();
            $table->string('name');
            $table->string('sector')->nullable();
            $table->string('industry')->nullable();
            $table->string('trading_board')->nullable();
            $table->text('activity_reason')->nullable();
            $table->string('current_status')->nullable();
            $table->decimal('latest_price', 12, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('stock_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('non-compliant');
            $table->boolean('verified_by_scholar')->default(false);
            $table->timestamps();
        });

        Schema::create('financials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('reporting_period')->nullable();
            $table->string('published_date')->nullable();
            $table->string('source_url')->nullable();
            $table->timestamps();
        });

        Schema::create('aaoifi_screenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('business_status')->default('fail');
            $table->text('business_reasoning')->nullable();
            $table->decimal('debt_ratio', 8, 4)->nullable();
            $table->string('debt_status')->nullable();
            $table->decimal('cash_ratio', 8, 4)->nullable();
            $table->string('cash_status')->nullable();
            $table->decimal('impermissible_income_ratio', 8, 4)->nullable();
            $table->string('impermissible_income_status')->nullable();
            $table->string('final_status')->default('non-compliant');
            $table->json('news_sources')->nullable();
            $table->json('financial_data_used')->nullable();
            $table->text('evidence_links')->nullable();
            $table->string('reporting_period')->nullable();
            $table->unsignedInteger('reporting_year')->nullable();
            $table->string('published_date')->nullable();
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
    }

    public function test_rawdha_uses_quarterly_quotas_of_30_screens_and_6_purifications(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-15 12:00:00'));

        try {
            $this->seed(PlanSeeder::class);

            $proPlan = Plan::where('slug', 'pro')->firstOrFail();
            $this->assertSame(30, $proPlan->features['stock_screens_per_month']);
            $this->assertSame(6, $proPlan->features['purifications_per_month']);

            // Verify migration also upgrades any legacy 10/2 pro features in DB
            $proPlan->update(['features' => array_merge($proPlan->features, [
                'stock_screens_per_month' => 10,
                'purifications_per_month' => 2,
            ])]);
            $migration = require database_path('migrations/2026_11_15_120000_update_rawdha_quotas_to_quarterly.php');
            $migration->up();
            $proPlan->refresh();
            $this->assertSame(30, $proPlan->features['stock_screens_per_month']);
            $this->assertSame(6, $proPlan->features['purifications_per_month']);

            $freeUser = User::factory()->create(['email_verified_at' => now()]);
            $freeSummary = SubscriptionService::getUsageSummary($freeUser);
            $this->assertSame(3, $freeSummary['stock_screens_per_month']['limit']);
            $this->assertSame('month', $freeSummary['stock_screens_per_month']['period']);

            $rawdhaUser = User::factory()->create(['email_verified_at' => now()]);
            Subscription::create([
                'user_id' => $rawdhaUser->id,
                'plan_id' => $proPlan->id,
                'billing_cycle' => 'quarterly',
                'gateway' => 'squad',
                'status' => 'active',
                'renews_at' => now()->addMonths(3),
            ]);
            $rawdhaUser->refresh();

            $company = Company::create([
                'symbol' => 'ABBEYBANK',
                'name' => 'Abbey Mortgage Bank Plc',
                'sector' => 'Financial Services',
                'current_status' => 'non-compliant',
                'is_active' => true,
            ]);

            AaoifiScreening::create([
                'company_id' => $company->id,
                'business_status' => 'fail',
                'business_reasoning' => 'Conventional financial institution.',
                'final_status' => 'non-compliant',
            ]);

            Sanctum::actingAs($rawdhaUser);

            $res = $this->getJson('/api/v1/stocks/ABBEYBANK/aaoifi-screening');
            $res->assertOk()
                ->assertJsonPath('data.screen_usage.used', 1)
                ->assertJsonPath('data.screen_usage.limit', 30)
                ->assertJsonPath('data.screen_usage.remaining', 29)
                ->assertJsonPath('data.screen_usage.period', 'quarter');

            $proSummary = SubscriptionService::getUsageSummary($rawdhaUser);
            $this->assertSame(6, $proSummary['purifications_per_month']['limit']);
            $this->assertSame('quarter', $proSummary['purifications_per_month']['period']);

            $usage = UserUsage::where('user_id', $rawdhaUser->id)
                ->where('feature', 'stock_screens_per_month')
                ->firstOrFail();
            $this->assertSame('2027-01-01', $usage->reset_at->toDateString());
        } finally {
            Carbon::setTestNow();
        }
    }
}
