<?php

namespace Tests\Feature;

use App\Models\AaoifiScreening;
use App\Models\Company;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MiftahStockScreenEnforcementTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            'baskets',
            'watchlists',
            'holdings',
            'dividends',
            'news',
            'daily_prices',
            'market_data',
            'financials',
            'stock_statuses',
            'user_usages',
            'aaoifi_screenings',
            'companies',
            'subscriptions',
            'plans',
            'users',
        ] as $table) {
            Schema::dropIfExists($table);
        }

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
            $table->unique(['user_id', 'feature']);
        });

        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('symbol')->unique();
            $table->string('name');
            $table->string('sector')->nullable();
            $table->string('industry')->nullable();
            $table->string('asset_class')->nullable();
            $table->string('trading_board')->nullable();
            $table->text('activity_reason')->nullable();
            $table->string('current_status')->nullable();
            $table->decimal('latest_price', 12, 2)->nullable();
            $table->decimal('market_cap', 18, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('stock_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('halal');
            $table->text('reason')->nullable();
            $table->boolean('verified_by_scholar')->default(false);
            $table->timestamps();
        });

        Schema::create('financials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->decimal('pe_ratio', 8, 2)->nullable();
            $table->decimal('eps', 8, 2)->nullable();
            $table->decimal('interest_income', 18, 2)->nullable();
            $table->decimal('total_revenue', 18, 2)->nullable();
            $table->string('reporting_period')->nullable();
            $table->string('published_date')->nullable();
            $table->string('source_url')->nullable();
            $table->timestamps();
        });

        Schema::create('market_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('ticker')->nullable();
            $table->timestamps();
        });

        Schema::create('daily_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->date('date')->nullable();
            $table->decimal('close', 12, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('news', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('dividends', function (Blueprint $table) {
            $table->id();
            $table->string('ticker')->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('currency')->nullable();
            $table->string('dividend_type')->nullable();
            $table->date('ex_date')->nullable();
            $table->date('record_date')->nullable();
            $table->date('pay_date')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });

        Schema::create('aaoifi_screenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('business_status')->default('pass');
            $table->text('business_reasoning')->nullable();
            $table->decimal('debt_ratio', 8, 4)->nullable();
            $table->string('debt_status')->nullable();
            $table->decimal('cash_ratio', 8, 4)->nullable();
            $table->string('cash_status')->nullable();
            $table->decimal('impermissible_income_ratio', 8, 4)->nullable();
            $table->string('impermissible_income_status')->nullable();
            $table->string('final_status')->default('halal');
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

        $this->seed(PlanSeeder::class);
    }

    private function createCompany(string $symbol, ?string $assetClass = null): Company
    {
        $company = Company::create([
            'symbol' => $symbol,
            'name' => $symbol . ' Plc',
            'sector' => 'Consumer Goods',
            'asset_class' => $assetClass,
            'current_status' => 'halal',
            'latest_price' => 100.0,
            'is_active' => true,
        ]);

        AaoifiScreening::create([
            'company_id' => $company->id,
            'business_status' => 'pass',
            'debt_ratio' => 8.5,
            'debt_status' => 'pass',
            'cash_ratio' => 11.0,
            'cash_status' => 'pass',
            'impermissible_income_ratio' => 1.5,
            'impermissible_income_status' => 'pass',
            'final_status' => 'halal',
        ]);

        return $company;
    }

    public function test_stock_show_and_aaoifi_enforces_miftah_limit_of_3_without_double_counting(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        foreach (['MTNN', 'DANGCEM', 'BUAFOODS', 'SEPLAT'] as $sym) {
            $this->createCompany($sym);
        }
        $this->createCompany('LOTUSHMF', 'mutual_fund');

        // Calling both /stocks/MTNN and /stocks/MTNN/aaoifi-screening counts only 1 credit
        $this->getJson('/api/v1/stocks/MTNN')
            ->assertOk()
            ->assertJsonPath('data.screen_usage.used', 1)
            ->assertJsonPath('data.screen_usage.limit', 3);

        $this->getJson('/api/v1/stocks/MTNN/aaoifi-screening')
            ->assertOk()
            ->assertJsonPath('data.screen_usage.used', 1);

        // 2nd and 3rd unique symbols consume credits 2 and 3
        $this->getJson('/api/v1/stocks/DANGCEM')
            ->assertOk()
            ->assertJsonPath('data.screen_usage.used', 2);

        $this->getJson('/api/v1/stocks/BUAFOODS')
            ->assertOk()
            ->assertJsonPath('data.screen_usage.used', 3);

        // Re-visiting an already-screened stock remains free at 3/3
        $this->getJson('/api/v1/stocks/DANGCEM')->assertOk();

        // 4th unique stock is blocked with 403 Upgrade Required on BOTH endpoints
        $this->getJson('/api/v1/stocks/SEPLAT')
            ->assertStatus(403)
            ->assertJson([
                'upgrade_required' => true,
                'feature' => 'stock_screens_per_month',
                'required_tier' => 'pro',
            ]);

        $this->getJson('/api/v1/stocks/SEPLAT/aaoifi-screening')
            ->assertStatus(403)
            ->assertJson([
                'upgrade_required' => true,
                'feature' => 'stock_screens_per_month',
                'required_tier' => 'pro',
            ]);

        // Mutual funds are excluded from equity screening quota
        $this->getJson('/api/v1/stocks/LOTUSHMF')->assertOk();
    }
}
