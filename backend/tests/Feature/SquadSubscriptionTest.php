<?php

namespace Tests\Feature;

use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SquadSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    private Plan $rawdha;
    private Plan $noor;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.squad.secret', 'sandbox_sk_test_secret');
        Config::set('services.squad.public', 'sandbox_pk_test_public');
        Config::set('services.squad.base_url', 'https://sandbox-api-d.squadco.com');
        Config::set('app.frontend_url', 'https://iirshad.com');

        Plan::updateOrCreate(
            ['slug' => 'free'],
            ['name' => 'Miftah', 'price_monthly' => 0, 'price_quarterly' => 0, 'price_yearly' => 0]
        );

        $this->rawdha = Plan::updateOrCreate(
            ['slug' => 'pro'],
            ['name' => 'Rawdha', 'price_monthly' => 0, 'price_quarterly' => 6500, 'price_yearly' => 25000]
        );

        $this->noor = Plan::updateOrCreate(
            ['slug' => 'max'],
            ['name' => 'Noor', 'price_monthly' => 0, 'price_quarterly' => 8500, 'price_yearly' => 33000]
        );
    }

    public function test_initialize_creates_pending_transaction_and_returns_squad_checkout_url(): void
    {
        Http::fake([
            'https://sandbox-api-d.squadco.com/transaction/initiate' => Http::response([
                'status'  => 200,
                'success' => true,
                'data'    => [
                    'checkout_url'    => 'https://sandbox-pay.squadco.com/checkout/abc123',
                    'transaction_ref' => 'IRS_TEST123',
                ],
            ], 200),
        ]);

        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/subscription/initialize', [
            'plan_slug'     => 'pro',
            'billing_cycle' => 'quarterly',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['authorization_url', 'checkout_url', 'reference'])
            ->assertJson([
                'authorization_url' => 'https://sandbox-pay.squadco.com/checkout/abc123',
            ]);

        $ref = $response->json('reference');
        $this->assertDatabaseHas('payment_transactions', [
            'user_id'         => $user->id,
            'plan_id'         => $this->rawdha->id,
            'billing_cycle'   => 'quarterly',
            'transaction_ref' => $ref,
            'amount_kobo'     => 650000,
            'status'          => 'pending',
            'gateway'         => 'squad',
        ]);

        Http::assertSent(function ($request) use ($user, $ref) {
            return $request->url() === 'https://sandbox-api-d.squadco.com/transaction/initiate'
                && $request['email'] === $user->email
                && $request['amount'] === 650000
                && $request['currency'] === 'NGN'
                && $request['is_recurring'] === true
                && $request['transaction_ref'] === $ref
                && $request['callback_url'] === 'https://iirshad.com/settings/billing/callback';
        });
    }

    public function test_verify_activates_subscription_idempotently(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        $tx = PaymentTransaction::create([
            'user_id'         => $user->id,
            'plan_id'         => $this->rawdha->id,
            'billing_cycle'   => 'quarterly',
            'gateway'         => 'squad',
            'transaction_ref' => 'IRS_VERIFY123',
            'amount_kobo'     => 650000,
            'currency'        => 'NGN',
            'status'          => 'pending',
            'type'            => 'initial',
        ]);

        Http::fake([
            'https://sandbox-api-d.squadco.com/transaction/verify/IRS_VERIFY123' => Http::response([
                'status'  => 200,
                'success' => true,
                'data'    => [
                    'transaction_ref'    => 'IRS_VERIFY123',
                    'transaction_amount' => 650000,
                    'transaction_status' => 'Success',
                    'currency'           => 'NGN',
                ],
            ], 200),
        ]);

        $res1 = $this->postJson('/api/v1/subscription/verify', ['reference' => 'IRS_VERIFY123']);
        $res1->assertOk()->assertJson([
            'verified'                => true,
            'status'                  => 'success',
            'has_active_subscription' => true,
            'plan'                    => 'Rawdha',
            'billing_cycle'           => 'quarterly',
        ]);

        $sub = Subscription::where('user_id', $user->id)->first();
        $this->assertNotNull($sub);
        $this->assertEquals('squad', $sub->gateway);
        $this->assertEquals('active', $sub->status);
        $firstRenewsAt = $sub->renews_at->toIso8601String();

        // Second verify call must not extend renews_at again
        $res2 = $this->postJson('/api/v1/subscription/verify', ['reference' => 'IRS_VERIFY123']);
        $res2->assertOk()->assertJson(['verified' => true]);

        $sub->refresh();
        $this->assertEquals($firstRenewsAt, $sub->renews_at->toIso8601String());
    }

    public function test_webhook_verifies_hmac_signature_and_stores_card_token(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        PaymentTransaction::create([
            'user_id'         => $user->id,
            'plan_id'         => $this->noor->id,
            'billing_cycle'   => 'yearly',
            'gateway'         => 'squad',
            'transaction_ref' => 'IRS_WEBHOOK999',
            'amount_kobo'     => 3300000,
            'currency'        => 'NGN',
            'status'          => 'pending',
            'type'            => 'initial',
        ]);

        $payload = json_encode([
            'Event'          => 'charge_successful',
            'TransactionRef' => 'IRS_WEBHOOK999',
            'Body'           => [
                'amount'             => 3300000,
                'transaction_ref'    => 'IRS_WEBHOOK999',
                'gateway_ref'        => 'SQ_GW_999',
                'transaction_status' => 'Success',
                'email'              => $user->email,
                'currency'           => 'NGN',
                'payment_information' => [
                    'payment_type' => 'card',
                    'token_id'     => 'AUTH_SQUAD_TOKEN_XYZ',
                ],
            ],
        ]);

        // Reject invalid signature
        $this->call('POST', '/api/webhooks/squad', [], [], [], [
            'CONTENT_TYPE'                => 'application/json',
            'HTTP_X_SQUAD_ENCRYPTED_BODY' => 'invalid_sig',
        ], $payload)->assertStatus(401);

        // Accept valid HMAC-SHA512 signature (both /api/webhooks/squad and /api/v1/webhooks/squad work)
        $validSig = hash_hmac('sha512', $payload, 'sandbox_sk_test_secret');
        $this->call('POST', '/api/webhooks/squad', [], [], [], [
            'CONTENT_TYPE'                => 'application/json',
            'HTTP_X_SQUAD_ENCRYPTED_BODY' => $validSig,
        ], $payload)->assertOk();

        $this->assertDatabaseHas('subscriptions', [
            'user_id'              => $user->id,
            'plan_id'              => $this->noor->id,
            'gateway'              => 'squad',
            'squad_token_id'       => 'AUTH_SQUAD_TOKEN_XYZ',
            'last_transaction_ref' => 'IRS_WEBHOOK999',
            'status'               => 'active',
            'auto_renew'           => true,
        ]);
    }

    public function test_cancel_disables_auto_renew_and_preserves_access_until_period_end(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Sanctum::actingAs($user);

        $renewsAt = now()->addDays(20);
        Subscription::create([
            'user_id'              => $user->id,
            'plan_id'              => $this->rawdha->id,
            'billing_cycle'        => 'quarterly',
            'gateway'              => 'squad',
            'squad_token_id'       => 'AUTH_TO_CLEAR',
            'last_transaction_ref' => 'IRS_PREV',
            'auto_renew'           => true,
            'status'               => 'active',
            'renews_at'            => $renewsAt,
        ]);

        $this->postJson('/api/v1/subscription/cancel')
            ->assertOk();

        $sub = Subscription::where('user_id', $user->id)->first();
        $this->assertEquals('canceled', $sub->status);
        $this->assertFalse($sub->auto_renew);
        $this->assertNull($sub->squad_token_id);
        $this->assertNotNull($sub->ends_at);

        // User retains paid access during the remaining grace period
        $this->assertNotNull($user->fresh()->activeSubscription);
        $this->assertEquals('pro', $user->fresh()->tier->slug);
    }

    public function test_renewal_command_charges_due_tokenized_subscription(): void
    {
        Http::fake([
            'https://sandbox-api-d.squadco.com/transaction/charge_card' => Http::response([
                'status'  => 200,
                'success' => true,
                'message' => 'Success',
                'data'    => [
                    'transaction_status' => 'Success',
                    'amount'             => 650000,
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        $dueAt = now()->subHour();

        $sub = Subscription::create([
            'user_id'              => $user->id,
            'plan_id'              => $this->rawdha->id,
            'billing_cycle'        => 'quarterly',
            'gateway'              => 'squad',
            'squad_token_id'       => 'AUTH_RECUR_123',
            'last_transaction_ref' => 'IRS_OLD',
            'auto_renew'           => true,
            'status'               => 'active',
            'renews_at'            => $dueAt,
        ]);

        $this->artisan('app:charge-squad-renewals')->assertExitCode(0);

        $sub->refresh();
        $this->assertEquals('active', $sub->status);
        $this->assertTrue($sub->renews_at->greaterThan(now()->addMonths(2)));

        $this->assertDatabaseHas('payment_transactions', [
            'user_id' => $user->id,
            'type'    => 'renewal',
            'status'  => 'success',
        ]);
    }
}
