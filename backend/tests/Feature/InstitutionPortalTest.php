<?php

namespace Tests\Feature;

use App\Models\AaoifiScreening;
use App\Models\Company;
use App\Models\Dividend;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class InstitutionPortalTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('institutional_api_keys');
        Schema::dropIfExists('institutional_portfolios');
        Schema::dropIfExists('baskets');
        Schema::dropIfExists('watchlists');
        Schema::dropIfExists('holdings');
        Schema::dropIfExists('dividends');
        Schema::dropIfExists('aaoifi_screenings');
        Schema::dropIfExists('companies');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('user_usages');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('phone_number')->nullable();
            $table->string('location')->nullable();
            $table->string('role')->default('user');
            $table->string('institution_name')->nullable();
            $table->string('institution_type')->nullable();
            $table->string('plan')->default('free');
            $table->json('preferences')->nullable();
            $table->timestamp('welcome_email_sent_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->json('features')->nullable();
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('plan_id');
            $table->string('status')->default('active');
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });

        Schema::create('user_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->string('feature');
            $table->unsignedInteger('used_count')->default(0);
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->timestamps();
        });

        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('symbol')->unique();
            $table->string('name');
            $table->string('sector')->nullable();
            $table->string('asset_class')->default('equity');
            $table->string('current_status')->nullable();
            $table->decimal('latest_price', 14, 2)->nullable();
            $table->decimal('price_change_pct', 8, 2)->nullable();
            $table->decimal('market_cap', 20, 2)->nullable();
            $table->string('logo_url')->nullable();
            $table->text('activity_reason')->nullable();
            $table->json('fund_details')->nullable();
            $table->timestamps();
        });

        Schema::create('aaoifi_screenings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id');
            $table->string('business_status')->nullable();
            $table->json('business_reasoning')->nullable();
            $table->decimal('debt_ratio', 8, 4)->nullable();
            $table->string('debt_status')->nullable();
            $table->decimal('cash_ratio', 8, 4)->nullable();
            $table->string('cash_status')->nullable();
            $table->decimal('impermissible_income_ratio', 8, 4)->nullable();
            $table->string('impermissible_income_status')->nullable();
            $table->string('final_status')->nullable();
            $table->json('financial_data_used')->nullable();
            $table->string('reporting_period')->nullable();
            $table->integer('reporting_year')->nullable();
            $table->timestamps();
        });

        Schema::create('dividends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id');
            $table->decimal('amount', 12, 4)->default(0);
            $table->string('currency', 8)->default('NGN');
            $table->string('status')->default('paid');
            $table->timestamp('pay_date')->nullable();
            $table->timestamps();
        });

        Schema::create('holdings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->string('symbol');
            $table->decimal('shares', 16, 4)->default(0);
            $table->decimal('average_buy_price', 14, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('watchlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->string('symbol');
            $table->timestamps();
        });

        Schema::create('baskets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('institutional_portfolios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->string('name');
            $table->string('fund_code')->nullable();
            $table->string('benchmark')->nullable();
            $table->string('currency', 10)->default('NGN');
            $table->json('holdings_payload');
            $table->json('summary_snapshot')->nullable();
            $table->json('factsheet_meta')->nullable();
            $table->timestamps();
        });

        Schema::create('institutional_api_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->string('name', 120);
            $table->string('key_prefix', 24);
            $table->string('key_hash', 64)->unique();
            $table->json('scopes')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
    }

    private function seedSampleEquities(): void
    {
        app()->instance('verdict.unlock', true);
        $dangcem = Company::create([
            'symbol' => 'DANGCEM',
            'name' => 'Dangote Cement PLC',
            'sector' => 'INDUSTRIAL GOODS',
            'asset_class' => 'equity',
            'current_status' => 'halal',
            'latest_price' => 1469.90,
            'market_cap' => 24802444743045,
        ]);
        AaoifiScreening::create([
            'company_id' => $dangcem->id,
            'business_status' => 'pass',
            'debt_ratio' => 3.02,
            'debt_status' => 'pass',
            'cash_ratio' => 3.16,
            'cash_status' => 'pass',
            'impermissible_income_ratio' => 0.63,
            'impermissible_income_status' => 'pass',
            'final_status' => 'halal',
            'reporting_period' => 'Q3',
            'reporting_year' => 2026,
        ]);
        Dividend::create([
            'company_id' => $dangcem->id,
            'amount' => 45.00,
            'currency' => 'NGN',
            'status' => 'paid',
            'pay_date' => now()->subMonths(2),
        ]);

        $zenith = Company::create([
            'symbol' => 'ZENITHBANK',
            'name' => 'Zenith Bank PLC',
            'sector' => 'Financial Services',
            'asset_class' => 'equity',
            'current_status' => 'non-compliant',
            'latest_price' => 115.90,
            'market_cap' => 3600000000000,
        ]);
        AaoifiScreening::create([
            'company_id' => $zenith->id,
            'business_status' => 'fail',
            'debt_ratio' => 0,
            'debt_status' => 'pass',
            'cash_ratio' => 0,
            'cash_status' => 'pass',
            'impermissible_income_ratio' => 0,
            'impermissible_income_status' => 'fail',
            'final_status' => 'non-compliant',
            'reporting_period' => 'Q3',
            'reporting_year' => 2026,
        ]);

        $jaiz = Company::create([
            'symbol' => 'JAIZBANK',
            'name' => 'Jaiz Bank PLC',
            'sector' => 'Financial Services',
            'asset_class' => 'equity',
            'current_status' => 'halal',
            'latest_price' => 7.10,
            'market_cap' => 316584813357,
        ]);
        AaoifiScreening::create([
            'company_id' => $jaiz->id,
            'business_status' => 'pass',
            'debt_ratio' => 0,
            'debt_status' => 'pass',
            'cash_ratio' => 0,
            'cash_status' => 'pass',
            'impermissible_income_ratio' => 0,
            'impermissible_income_status' => 'pass',
            'final_status' => 'halal',
            'reporting_period' => 'Q3',
            'reporting_year' => 2026,
        ]);

        $hbmng = Company::create([
            'symbol' => 'HBMNG',
            'name' => 'HBMNG (Lafarge Africa)',
            'sector' => 'Industrial Goods',
            'asset_class' => 'equity',
            'current_status' => 'halal',
            'latest_price' => 325.00,
            'market_cap' => 5235033536200,
        ]);
        AaoifiScreening::create([
            'company_id' => $hbmng->id,
            'business_status' => 'pass',
            'debt_ratio' => 0,
            'debt_status' => 'pass',
            'cash_ratio' => 1.83,
            'cash_status' => 'pass',
            'impermissible_income_ratio' => 3.63,
            'impermissible_income_status' => 'pass',
            'final_status' => 'halal',
            'reporting_period' => 'Q3',
            'reporting_year' => 2026,
        ]);
        app()->instance('verdict.unlock', false);
    }

    public function test_institution_registration_creates_institution_role(): void
    {
        $res = $this->postJson('/api/v1/register', [
            'name' => 'Amina Bello',
            'email' => 'amina.lotus.inst@gmail.com',
            'password' => 'Xk9#mQp2!zR8',
            'password_confirmation' => 'Xk9#mQp2!zR8',
            'account_type' => 'institution',
            'institution_name' => 'Lotus Capital Limited',
            'institution_type' => 'Asset / Fund Manager',
        ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.user.role', 'institution')
            ->assertJsonPath('data.user.institution_name', 'Lotus Capital Limited');

        $this->assertDatabaseHas('users', [
            'email' => 'amina.lotus.inst@gmail.com',
            'role' => 'institution',
            'institution_name' => 'Lotus Capital Limited',
        ]);
    }

    public function test_standard_user_is_forbidden_from_institution_endpoints(): void
    {
        $retailUser = User::factory()->create(['role' => 'user']);

        $this->actingAs($retailUser, 'sanctum')
            ->getJson('/api/v1/institution/portfolios')
            ->assertStatus(403);
    }

    public function test_institution_can_upload_csv_screen_and_get_rebalancing_suggestions(): void
    {
        $this->seedSampleEquities();
        $institutionUser = User::factory()->create([
            'role' => 'institution',
            'institution_name' => 'Norrenberger Asset Management',
        ]);

        $csvContent = "Symbol,Shares\nWAPCO,100\nDANGCEM,200\nZENITHBANK,1000\n";
        $file = UploadedFile::fake()->createWithContent('book.csv', $csvContent);

        $res = $this->actingAs($institutionUser, 'sanctum')
            ->post('/api/v1/institution/screen-portfolio', ['file' => $file]);

        $res->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.summary.holdings_count', 3)
            ->assertJsonPath('data.summary.compliant_count', 2)
            ->assertJsonPath('data.summary.non_compliant_count', 1);

        $holdings = collect($res->json('data.holdings'));
        $this->assertNotNull($holdings->firstWhere('symbol', 'HBMNG'));

        $suggestions = $res->json('data.rebalancing_suggestions');
        $this->assertNotEmpty($suggestions);
        $this->assertSame('ZENITHBANK', $suggestions[0]['source_symbol']);
        $this->assertNotEmpty($suggestions[0]['replacements'], json_encode($res->json('data')));
        $this->assertSame('JAIZBANK', $suggestions[0]['replacements'][0]['symbol']);
    }

    public function test_institution_can_save_list_and_delete_mandates_with_isolation(): void
    {
        $this->seedSampleEquities();

        $instA = User::factory()->create(['role' => 'institution', 'institution_name' => 'Bank A']);
        $instB = User::factory()->create(['role' => 'institution', 'institution_name' => 'Bank B']);

        $saveRes = $this->actingAs($instA, 'sanctum')
            ->postJson('/api/v1/institution/portfolios', [
                'name' => 'Ethical Equity Sleeve',
                'holdings_payload' => [
                    ['symbol' => 'DANGCEM', 'shares' => 500],
                    ['symbol' => 'JAIZBANK', 'shares' => 10000],
                ],
                'factsheet_meta' => ['theme' => 'lotus', 'ticker' => 'ETH-A'],
            ]);

        $saveRes->assertStatus(200)
            ->assertJsonPath('data.portfolio.name', 'Ethical Equity Sleeve');

        $portfolioId = $saveRes->json('data.portfolio.id');

        $this->actingAs($instB, 'sanctum')
            ->getJson('/api/v1/institution/portfolios')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');

        $this->actingAs($instB, 'sanctum')
            ->deleteJson("/api/v1/institution/portfolios/{$portfolioId}")
            ->assertStatus(404);

        $this->actingAs($instA, 'sanctum')
            ->deleteJson("/api/v1/institution/portfolios/{$portfolioId}")
            ->assertStatus(200);
    }

    public function test_public_demo_presets_endpoint_returns_lotus_and_norrenberger(): void
    {
        $this->seedSampleEquities();

        $res = $this->getJson('/api/v1/institution/demo-presets');
        $res->assertStatus(200)
            ->assertJsonPath('data.lotus_etf.ticker', 'LOTUSHAL15')
            ->assertJsonPath('data.norrenberger_fund.fund_name', 'Norrenberger Islamic Fund');
    }

    public function test_workspace_isolates_tenant_information_per_institution(): void
    {
        $this->seedSampleEquities();

        $lotusUser = User::factory()->create([
            'role' => 'institution',
            'email' => 'lotus@iirshad.com',
            'institution_name' => 'Lotus Capital Limited',
        ]);
        $norrenUser = User::factory()->create([
            'role' => 'institution',
            'email' => 'norrenberger@iirshad.com',
            'institution_name' => 'Norrenberger Asset Management Limited',
        ]);
        $brokerUser = User::factory()->create([
            'role' => 'institution',
            'email' => 'desk@stanbicbroker.example',
            'institution_name' => 'Stanbic Stockbrokers',
        ]);

        // Lotus sees ONLY Lotus
        $this->actingAs($lotusUser, 'sanctum')
            ->getJson('/api/v1/institution/workspace')
            ->assertStatus(200)
            ->assertJsonPath('data.tenant_key', 'lotus')
            ->assertJsonPath('data.lotus_etf.ticker', 'LOTUSHAL15')
            ->assertJsonPath('data.norrenberger_fund', null);

        // Norrenberger sees ONLY Norrenberger
        $this->actingAs($norrenUser, 'sanctum')
            ->getJson('/api/v1/institution/workspace')
            ->assertStatus(200)
            ->assertJsonPath('data.tenant_key', 'norrenberger')
            ->assertJsonPath('data.norrenberger_fund.fund_name', 'Norrenberger Islamic Fund')
            ->assertJsonPath('data.lotus_etf', null);

        // Other banks/brokers see NEITHER Lotus NOR Norrenberger
        $this->actingAs($brokerUser, 'sanctum')
            ->getJson('/api/v1/institution/workspace')
            ->assertStatus(200)
            ->assertJsonPath('data.tenant_key', 'custom')
            ->assertJsonPath('data.lotus_etf', null)
            ->assertJsonPath('data.norrenberger_fund', null);
    }

    public function test_institution_can_generate_api_key_and_call_b2b_pretrade_guardrail_and_revoke(): void
    {
        $this->seedSampleEquities();

        $brokerUser = User::factory()->create([
            'role' => 'institution',
            'institution_name' => 'CardinalStone Securities',
        ]);

        // 1. Generate API key
        $createRes = $this->actingAs($brokerUser, 'sanctum')
            ->postJson('/api/v1/institution/api-keys', [
                'name' => 'OMS Production',
            ]);

        $createRes->assertStatus(201);
        $plainKey = $createRes->json('data.plain_text_key');
        $keyId = $createRes->json('data.api_key.id');
        $this->assertStringStartsWith('irsh_live_', $plainKey);

        // 2. Use X-Api-Key header on B2B pre-trade guardrail (blocked stock)
        $this->withHeaders(['X-Api-Key' => $plainKey])
            ->getJson('/api/v1/b2b/stocks/ZENITHBANK/pre-trade-check?units=5000')
            ->assertStatus(200)
            ->assertJsonPath('data.order_allowed', false)
            ->assertJsonPath('data.guardrail_action', 'BLOCK')
            ->assertJsonPath('data.compliant_alternatives.0.symbol', 'JAIZBANK');

        // 3. Use X-Api-Key header on B2B pre-trade guardrail (halal stock)
        $this->withHeaders(['X-Api-Key' => $plainKey])
            ->getJson('/api/v1/b2b/stocks/DANGCEM/pre-trade-check?units=100')
            ->assertStatus(200)
            ->assertJsonPath('data.order_allowed', true)
            ->assertJsonPath('data.guardrail_action', 'APPROVE');

        // 4. Use Bearer irsh_live_... on B2B bulk screen
        $this->withHeaders(['Authorization' => "Bearer {$plainKey}"])
            ->postJson('/api/v1/b2b/portfolio/screen', [
                'holdings' => [
                    ['symbol' => 'DANGCEM', 'shares' => 100],
                    ['symbol' => 'ZENITHBANK', 'shares' => 500],
                ],
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.summary.compliant_count', 1)
            ->assertJsonPath('data.summary.non_compliant_count', 1);

        // 5. Revoke key and confirm 401
        $this->actingAs($brokerUser, 'sanctum')
            ->deleteJson("/api/v1/institution/api-keys/{$keyId}")
            ->assertStatus(200);

        $this->withHeaders(['X-Api-Key' => $plainKey])
            ->getJson('/api/v1/b2b/stocks/DANGCEM/pre-trade-check')
            ->assertStatus(401);
    }
}
