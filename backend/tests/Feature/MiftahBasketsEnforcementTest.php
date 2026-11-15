<?php

namespace Tests\Feature;

use App\Models\Basket;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MiftahBasketsEnforcementTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            'baskets',
            'user_usages',
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

        Schema::create('baskets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->json('symbols')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $this->seed(PlanSeeder::class);
    }

    public function test_miftah_users_are_locked_from_thematic_and_custom_baskets(): void
    {
        $miftah = User::factory()->create(['email_verified_at' => now()]);
        $curated = Basket::create([
            'user_id' => null,
            'name' => 'Halal Tech Leaders',
            'category' => 'Tech',
            'symbols' => ['MTNN', 'AIRTELAFRI', 'CWG'],
            'is_active' => true,
        ]);
        $legacyCustom = Basket::create([
            'user_id' => $miftah->id,
            'name' => 'Old Custom Basket',
            'category' => 'Custom',
            'symbols' => ['DANGCEM', 'BUAFOODS'],
            'is_active' => true,
        ]);

        Sanctum::actingAs($miftah);

        // Index returns lock metadata for Miftah on both curated and legacy custom baskets
        $this->getJson('/api/v1/stocks/baskets')
            ->assertOk()
            ->assertJsonPath('data.0.is_locked', true)
            ->assertJsonPath('data.0.required_tier', 'pro')
            ->assertJsonPath('data.1.is_locked', true)
            ->assertJsonPath('data.1.required_tier', 'pro');

        // Viewing curated or custom basket details is blocked on Miftah
        $this->getJson("/api/v1/stocks/baskets/{$curated->id}")
            ->assertStatus(403)
            ->assertJsonPath('upgrade_required', true)
            ->assertJsonPath('feature', 'baskets');

        $this->getJson("/api/v1/stocks/baskets/{$legacyCustom->id}")
            ->assertStatus(403)
            ->assertJsonPath('upgrade_required', true);

        // Creating, updating, and investing are blocked on Miftah
        $this->postJson('/api/v1/stocks/baskets', [
            'name' => 'Blocked Miftah Basket',
            'symbols' => ['MTNN', 'DANGCEM'],
        ])->assertStatus(403)->assertJsonPath('upgrade_required', true);

        $this->putJson("/api/v1/stocks/baskets/{$legacyCustom->id}", [
            'name' => 'Updated Name',
        ])->assertStatus(403)->assertJsonPath('upgrade_required', true);

        $this->postJson("/api/v1/stocks/baskets/{$curated->id}/invest", [
            'amount' => 5000,
        ])->assertStatus(403)->assertJsonPath('upgrade_required', true);
    }

    public function test_rawdha_users_can_view_create_and_update_baskets(): void
    {
        $rawdha = User::factory()->create(['email_verified_at' => now()]);
        $proPlan = Plan::where('slug', 'pro')->firstOrFail();
        Subscription::create([
            'user_id' => $rawdha->id,
            'plan_id' => $proPlan->id,
            'status' => 'active',
            'billing_cycle' => 'quarterly',
            'renews_at' => now()->addMonths(3),
        ]);

        $curated = Basket::create([
            'user_id' => null,
            'name' => 'Curated 1',
            'category' => 'Tech',
            'symbols' => ['MTNN', 'AIRTELAFRI'],
            'is_active' => true,
        ]);

        Sanctum::actingAs($rawdha);

        $this->getJson("/api/v1/stocks/baskets/{$curated->id}")->assertOk();

        $created = $this->postJson('/api/v1/stocks/baskets', [
            'name' => 'My Halal Growth',
            'symbols' => ['DANGCEM', 'BUAFOODS'],
        ])->assertStatus(201);

        $basketId = $created->json('data.id');
        $this->putJson("/api/v1/stocks/baskets/{$basketId}", [
            'name' => 'My Halal Growth v2',
        ])->assertOk()->assertJsonPath('data.name', 'My Halal Growth v2');
    }
}
