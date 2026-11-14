<?php

namespace App\Services;

use App\Models\PaymentTransaction;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SquadService
{
    public function isConfigured(): bool
    {
        return !empty($this->secret());
    }

    protected function secret(): string
    {
        return (string) config('services.squad.secret', '');
    }

    protected function baseUrl(): string
    {
        return rtrim((string) config('services.squad.base_url', 'https://sandbox-api-d.squadco.com'), '/');
    }

    /**
     * Initiate a Squad payment session with card tokenization enabled for recurring renewals.
     */
    public function initiateTransaction(
        User $user,
        int $amountKobo,
        string $transactionRef,
        string $callbackUrl,
        array $metadata = []
    ): array {
        $response = Http::withToken($this->secret())
            ->timeout(15)
            ->post("{$this->baseUrl()}/transaction/initiate", [
                'email'           => $user->email,
                'amount'          => $amountKobo,
                'currency'        => 'NGN',
                'initiate_type'   => 'inline',
                'transaction_ref' => $transactionRef,
                'callback_url'    => $callbackUrl,
                'is_recurring'    => true,
                'customer_name'   => $user->name,
                'metadata'        => $metadata,
            ]);

        $json = $response->json() ?? [];
        $checkoutUrl = data_get($json, 'data.checkout_url');

        if ($response->successful() && !empty($checkoutUrl)) {
            return [
                'success'      => true,
                'checkout_url' => $checkoutUrl,
                'data'         => data_get($json, 'data', []),
            ];
        }

        Log::error('Squad transaction initiate failed', [
            'status' => $response->status(),
            'body'   => $json,
        ]);

        return [
            'success' => false,
            'message' => data_get($json, 'message', 'Unable to initialize payment with Squad.'),
            'body'    => $json,
        ];
    }

    /**
     * Verify a transaction directly with Squad's verify endpoint.
     */
    public function verifyTransaction(string $transactionRef): ?array
    {
        $response = Http::withToken($this->secret())
            ->timeout(15)
            ->get("{$this->baseUrl()}/transaction/verify/" . urlencode($transactionRef));

        if (!$response->successful()) {
            Log::warning('Squad transaction verify failed', [
                'ref'    => $transactionRef,
                'status' => $response->status(),
                'body'   => $response->json(),
            ]);
            return null;
        }

        return $response->json('data');
    }

    /**
     * Charge a tokenized card via Squad's recurring charge_card endpoint.
     */
    public function chargeCardToken(
        User $user,
        int $amountKobo,
        string $transactionRef,
        string $tokenId
    ): array {
        $response = Http::withToken($this->secret())
            ->timeout(20)
            ->post("{$this->baseUrl()}/transaction/charge_card", [
                'email'           => $user->email,
                'amount'          => $amountKobo,
                'currency'        => 'NGN',
                'transaction_ref' => $transactionRef,
                'token_id'        => $tokenId,
            ]);

        $json = $response->json() ?? [];
        $data = data_get($json, 'data', []);
        $txStatus = strtolower((string) (data_get($data, 'transaction_status') ?? data_get($data, 'status') ?? ''));

        $ok = $response->successful()
            && ((int) ($json['status'] ?? 0) === 200 || ($json['success'] ?? false) === true)
            && !in_array($txStatus, ['failed', 'abandoned', 'declined'], true);

        if (!$ok) {
            Log::warning('Squad charge_card failed', [
                'ref'    => $transactionRef,
                'status' => $response->status(),
                'body'   => $json,
            ]);
        }

        return [
            'success' => $ok,
            'data'    => is_array($data) ? $data : [],
            'message' => data_get($json, 'message'),
        ];
    }

    /**
     * Validate Squad's HMAC-SHA512 webhook signature from x-squad-encrypted-body.
     */
    public function verifyWebhookSignature(string $rawPayload, ?string $signatureHeader): bool
    {
        $secret = $this->secret();
        if (empty($secret) || empty($signatureHeader)) {
            return false;
        }

        $expected = hash_hmac('sha512', $rawPayload, $secret);
        return hash_equals(strtolower($expected), strtolower(trim($signatureHeader)));
    }

    /**
     * Idempotently mark a transaction successful and activate or renew the user's subscription.
     */
    public function activateFromTransaction(PaymentTransaction $transaction, array $gatewayData): Subscription
    {
        $tokenId = data_get($gatewayData, 'payment_information.token_id')
            ?? data_get($gatewayData, 'authorization.token_id')
            ?? data_get($gatewayData, 'token_id');

        $gatewayRef = data_get($gatewayData, 'gateway_ref')
            ?? data_get($gatewayData, 'gateway_transaction_ref');

        $subscription = DB::transaction(function () use ($transaction, $gatewayData, $tokenId, $gatewayRef) {
            /** @var PaymentTransaction $lockedTx */
            $lockedTx = PaymentTransaction::where('id', $transaction->id)->lockForUpdate()->firstOrFail();

            if ($lockedTx->status === 'success') {
                $existingSub = Subscription::where('user_id', $lockedTx->user_id)
                    ->where('plan_id', $lockedTx->plan_id)
                    ->where('status', 'active')
                    ->latest('id')
                    ->first();

                // Attach card token if webhook delivered it after callback verification already activated the plan
                if ($existingSub && $tokenId && empty($existingSub->squad_token_id)) {
                    $existingSub->update(['squad_token_id' => $tokenId]);
                }

                return $existingSub ?? Subscription::where('user_id', $lockedTx->user_id)->latest('id')->firstOrFail();
            }

            $paidAt = now();
            $lockedTx->update([
                'status'      => 'success',
                'gateway_ref' => $gatewayRef ?? $lockedTx->gateway_ref,
                'paid_at'     => $paidAt,
                'raw_payload' => $gatewayData,
            ]);

            // Cancel active subscriptions on other plans when switching/upgrading
            Subscription::where('user_id', $lockedTx->user_id)
                ->where('status', 'active')
                ->where('plan_id', '!=', $lockedTx->plan_id)
                ->update([
                    'status'     => 'canceled',
                    'auto_renew' => false,
                    'ends_at'    => $paidAt,
                ]);

            $existingSamePlan = Subscription::where('user_id', $lockedTx->user_id)
                ->where('plan_id', $lockedTx->plan_id)
                ->latest('id')
                ->first();

            $renewalAnchor = ($lockedTx->type === 'renewal' && $existingSamePlan?->renews_at && $existingSamePlan->renews_at->isFuture())
                ? $existingSamePlan->renews_at->copy()
                : $paidAt->copy();

            $renewsAt = $this->nextRenewalDate($renewalAnchor, $lockedTx->billing_cycle);

            $subAttributes = [
                'billing_cycle'        => $lockedTx->billing_cycle,
                'gateway'              => 'squad',
                'last_transaction_ref' => $lockedTx->transaction_ref,
                'auto_renew'           => true,
                'status'               => 'active',
                'renews_at'            => $renewsAt,
                'ends_at'              => null,
            ];

            if ($tokenId) {
                $subAttributes['squad_token_id'] = $tokenId;
            }

            return Subscription::updateOrCreate(
                ['user_id' => $lockedTx->user_id, 'plan_id' => $lockedTx->plan_id],
                $subAttributes
            );
        });

        try {
            Cache::tags(['users'])->forget("user.profile.{$transaction->user_id}");
        } catch (\Throwable $e) {
            // Cache store may not support tags
        }

        return $subscription;
    }

    public function nextRenewalDate(Carbon $from, string $billingCycle): Carbon
    {
        return match ($billingCycle) {
            'yearly'    => $from->copy()->addYear(),
            'quarterly' => $from->copy()->addMonths(3),
            default     => $from->copy()->addMonth(),
        };
    }
}
