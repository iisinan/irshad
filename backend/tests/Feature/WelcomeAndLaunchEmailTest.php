<?php

namespace Tests\Feature;

use App\Mail\LaunchAnnouncementEmail;
use App\Mail\RizqPlannerAnnouncementEmail;
use App\Mail\WelcomeEmail;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Database\Seeders\PlanSeeder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WelcomeAndLaunchEmailTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            'personal_access_tokens',
            'baskets',
            'watchlists',
            'holdings',
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
            $table->string('phone_number')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('welcome_email_sent_at')->nullable();
            $table->timestamp('launch_announcement_sent_at')->nullable();
            $table->timestamp('rizq_planner_email_sent_at')->nullable();
            $table->string('password')->nullable();
            $table->string('location')->nullable();
            $table->string('role')->default('user');
            $table->string('plan')->default('free');
            $table->string('google_id')->nullable();
            $table->string('apple_id')->nullable();
            $table->string('avatar')->nullable();
            $table->string('institution_name')->nullable();
            $table->string('institution_type')->nullable();
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

    public function test_welcome_email_is_sent_on_first_registration_and_not_on_login(): void
    {
        Mail::fake();
        Notification::fake();

        $this->postJson('/api/v1/register', [
            'name' => 'Amina Bello',
            'email' => 'amina.irshad.test@gmail.com',
            'password' => 'IrshadLaunch#9472!xQ',
            'password_confirmation' => 'IrshadLaunch#9472!xQ',
            'location' => 'Lagos, Nigeria',
        ])->assertStatus(201);

        Mail::assertQueued(WelcomeEmail::class, function (WelcomeEmail $mail) {
            return $mail->hasTo('amina.irshad.test@gmail.com');
        });
        Notification::assertSentTo(
            User::where('email', 'amina.irshad.test@gmail.com')->firstOrFail(),
            VerifyEmailNotification::class
        );

        $user = User::where('email', 'amina.irshad.test@gmail.com')->firstOrFail();
        $this->assertNotNull($user->welcome_email_sent_at);

        // Subsequent login does not re-send the welcome email
        Mail::fake();
        $this->postJson('/api/v1/login', [
            'email' => 'amina.irshad.test@gmail.com',
            'password' => 'IrshadLaunch#9472!xQ',
        ])->assertOk();

        Mail::assertNothingQueued();
        Mail::assertNothingSent();
    }

    public function test_launch_announcement_command_dry_run_preview_and_idempotent_send(): void
    {
        Mail::fake();

        $verified = User::factory()->create([
            'name' => 'Verified User',
            'email' => 'verified@gmail.com',
            'email_verified_at' => now(),
        ]);
        $unverified = User::factory()->create([
            'name' => 'Unverified User',
            'email' => 'unverified@gmail.com',
            'email_verified_at' => null,
        ]);
        $synthetic = User::factory()->create([
            'name' => 'Synthetic User',
            'email' => 'synthetic@example.com',
            'email_verified_at' => now(),
        ]);

        // Dry run sends nothing
        $this->artisan('irshad:send-launch-email --dry-run')
            ->assertExitCode(0);
        Mail::assertNothingQueued();
        Mail::assertNothingSent();

        // Single preview email sends only to the preview address and does not stamp users
        $this->artisan('irshad:send-launch-email --test-email=founder@gmail.com')
            ->assertExitCode(0);
        Mail::assertQueued(LaunchAnnouncementEmail::class, function (LaunchAnnouncementEmail $mail) {
            return $mail->hasTo('founder@gmail.com');
        });
        $this->assertNull($verified->fresh()->launch_announcement_sent_at);

        // Live blast sends to all eligible real users once, skips reserved domains, and is idempotent on re-run
        Mail::fake();
        $this->artisan('irshad:send-launch-email --force')
            ->assertExitCode(0);

        Mail::assertQueued(LaunchAnnouncementEmail::class, 2);
        $this->assertNotNull($verified->fresh()->launch_announcement_sent_at);
        $this->assertNotNull($unverified->fresh()->launch_announcement_sent_at);
        $this->assertNull($synthetic->fresh()->launch_announcement_sent_at);

        Mail::fake();
        $this->artisan('irshad:send-launch-email --force')
            ->assertExitCode(0);
        Mail::assertNothingQueued();
    }

    public function test_admin_creating_institution_sends_immediate_welcome_email(): void
    {
        Mail::fake();

        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
        Sanctum::actingAs($admin);

        // Institution name is required for institution accounts
        $this->postJson('/api/v1/admin/users', [
            'name' => 'Amina Desk',
            'email' => 'desk@acme-asset.ng',
            'password' => 'StrongPass#2026!',
            'role' => 'institution',
        ])->assertStatus(422);

        // Creating a valid institution sends an immediate synchronous welcome email
        $res = $this->postJson('/api/v1/admin/users', [
            'name' => 'Amina Desk',
            'email' => 'desk@acme-asset.ng',
            'password' => 'StrongPass#2026!',
            'role' => 'institution',
            'institution_name' => 'Acme Asset Management Ltd',
            'institution_type' => 'Asset / Fund Manager',
        ])->assertStatus(201)
            ->assertJsonPath('welcome_email_sent', true)
            ->assertJsonPath('user.role', 'institution')
            ->assertJsonPath('user.institution_name', 'Acme Asset Management Ltd');

        Mail::assertSent(WelcomeEmail::class, function (WelcomeEmail $mail) {
            $envelope = $mail->envelope();
            $content = $mail->content();
            return $mail->hasTo('desk@acme-asset.ng')
                && str_contains($envelope->subject, 'Acme Asset Management Ltd')
                && $content->markdown === 'emails.welcome_institution'
                && ($content->with['institutionName'] ?? null) === 'Acme Asset Management Ltd';
        });

        $created = User::where('email', 'desk@acme-asset.ng')->firstOrFail();
        $this->assertNotNull($created->welcome_email_sent_at);

        // Logging in afterward does not re-send welcome email
        Mail::fake();
        \Illuminate\Support\Facades\Auth::shouldUse('web');
        $this->postJson('/api/v1/login', [
            'email' => 'desk@acme-asset.ng',
            'password' => 'StrongPass#2026!',
        ])->assertOk();

        Mail::assertNothingQueued();
        Mail::assertNothingSent();
    }

    public function test_rizq_planner_announcement_command_dry_run_preview_and_idempotent_send(): void
    {
        Mail::fake();

        $verified = User::factory()->create([
            'name' => 'Amina Investor',
            'email' => 'amina@gmail.com',
            'email_verified_at' => now(),
        ]);
        $unverified = User::factory()->create([
            'name' => 'Bilal Investor',
            'email' => 'bilal@gmail.com',
            'email_verified_at' => null,
        ]);
        $synthetic = User::factory()->create([
            'name' => 'Synthetic User',
            'email' => 'synthetic@example.com',
            'email_verified_at' => now(),
        ]);

        // Dry run sends nothing
        $this->artisan('irshad:send-rizq-planner-email --dry-run')
            ->assertExitCode(0);
        Mail::assertNothingQueued();
        Mail::assertNothingSent();

        // Single preview email sends immediately via sendNow without stamping DB users
        $this->artisan('irshad:send-rizq-planner-email --test-email=sinanismailaidris@gmail.com')
            ->assertExitCode(0);
        Mail::assertSent(RizqPlannerAnnouncementEmail::class, function (RizqPlannerAnnouncementEmail $mail) {
            $content = $mail->content();
            return $mail->hasTo('sinanismailaidris@gmail.com')
                && $content->markdown === 'emails.rizq_planner_announcement'
                && str_ends_with((string) ($content->with['rizqPlannerUrl'] ?? ''), '/rizq-planner');
        });
        $this->assertNull($verified->fresh()->rizq_planner_email_sent_at);

        // Live blast sends to eligible real users once, skips synthetic domains, and is idempotent
        Mail::fake();
        $this->artisan('irshad:send-rizq-planner-email --force')
            ->assertExitCode(0);

        Mail::assertQueued(RizqPlannerAnnouncementEmail::class, 2);
        $this->assertNotNull($verified->fresh()->rizq_planner_email_sent_at);
        $this->assertNotNull($unverified->fresh()->rizq_planner_email_sent_at);
        $this->assertNull($synthetic->fresh()->rizq_planner_email_sent_at);

        Mail::fake();
        $this->artisan('irshad:send-rizq-planner-email --force')
            ->assertExitCode(0);
        Mail::assertNothingQueued();
    }
}
