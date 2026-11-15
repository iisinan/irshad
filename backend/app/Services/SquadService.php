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
        $payload = [
            'email'           => $user->email,
            'amount'          => $amountKobo,
            'currency'        => 'NGN',
            'initiate_type'   => 'inline',
            'transaction_ref' => $transactionRef,
            'callback_url'    => $callbackUrl,
            'customer_name'   => $user->name,
            'metadata'        => $metadata,
        ];

        $tryRecurring = (bool) config('services.squad.recurring', false)
            && !Cache::get('squad:recurring_unauthorized', false);
        if ($tryRecurring) {
            $payload['is_recurring'] = true;
        }

        $response = Http::withToken($this->secret())
            ->timeout(15)
            ->post("{$this->baseUrl()}/transaction/initiate", $payload);

        $json = $response->json() ?? [];

        // If merchant account does not yet have recurring/tokenization enabled by Squad,
        // cache that state and fall back to standard checkout so users can still subscribe immediately.
        if (
            $tryRecurring
            && !$response->successful()
            && in_array($response->status(), [400, 403], true)
            && str_contains(strtolower((string) data_get($json, 'message', '')), 'not authorized')
        ) {
            Log::warning('Squad recurring not yet authorized on merchant account; retrying standard checkout');
            Cache::put('squad:recurring_unauthorized', true, now()->addHours(6));
            unset($payload['is_recurring']);
            $response = Http::withToken($this->secret())
                ->timeout(15)
                ->post("{$this->baseUrl()}/transaction/initiate", $payload);
            $json = $response->json() ?? [];
        }

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
                    $existingSub->update([
                        'squad_token_id' => $tokenId,
                        'auto_renew'     => true,
                    ]);
                }

                return $existingSub ?? Subscription::where('user_id', $lockedTx->user_id)->latest('id')->firstOrFail();
            }

            $paidAt = now();
            $targetPlan = \App\Models\Plan::find($lockedTx->plan_id);
            $previousUser = User::with('activeSubscription.plan')->find($lockedTx->user_id);
            $previousSlug = $previousUser?->tier?->slug ?? 'free';

            // Convert unused paid period on any active/grace subscription into credit days when upgrading/switching mid-cycle
            $creditDays = 0;
            $targetCyclePrice = $targetPlan ? (float) $targetPlan->priceForCycle($lockedTx->billing_cycle) : 0.0;
            $targetCycleDays = $lockedTx->billing_cycle === 'yearly' ? 365 : 90;
            if ($lockedTx->type !== 'renewal' && $targetCyclePrice > 0) {
                $previousPaidSub = Subscription::with('plan')
                    ->where('user_id', $lockedTx->user_id)
                    ->whereIn('status', ['active', 'canceled'])
                    ->where(function ($q) use ($paidAt) {
                        $q->where('ends_at', '>', $paidAt)
                          ->orWhere(function ($q2) use ($paidAt) {
                              $q2->whereNull('ends_at')->where('renews_at', '>', $paidAt);
                          });
                    })
                    ->latest('id')
                    ->first();

                if ($previousPaidSub && $previousPaidSub->plan && $previousPaidSub->plan->slug !== 'free') {
                    $prevEnd = $previousPaidSub->ends_at ?? $previousPaidSub->renews_at;
                    if ($prevEnd && $prevEnd->greaterThan($paidAt)) {
                        $remainingDays = max(0, $paidAt->diffInSeconds($prevEnd, false)) / 86400;
                        $prevCycleDays = $previousPaidSub->billing_cycle === 'yearly' ? 365 : 90;
                        $prevPrice = (float) $previousPaidSub->plan->priceForCycle($previousPaidSub->billing_cycle);
                        if ($prevPrice > 0 && $remainingDays > 0) {
                            $unusedValue = $prevPrice * min(1.0, $remainingDays / $prevCycleDays);
                            $newDailyRate = $targetCyclePrice / $targetCycleDays;
                            if ($newDailyRate > 0) {
                                $creditDays = (int) min($targetCycleDays, round($unusedValue / $newDailyRate));
                            }
                        }
                    }
                }
            }

            $lockedTx->update([
                'status'      => 'success',
                'gateway_ref' => $gatewayRef ?? $lockedTx->gateway_ref,
                'paid_at'     => $paidAt,
                'raw_payload' => $gatewayData,
            ]);

            // Cancel active or past_due subscriptions on other plans when switching/upgrading
            Subscription::where('user_id', $lockedTx->user_id)
                ->whereIn('status', ['active', 'past_due'])
                ->where('plan_id', '!=', $lockedTx->plan_id)
                ->update([
                    'status'     => 'canceled',
                    'auto_renew' => false,
                    'ends_at'    => $paidAt,
                ]);

            $existingSamePlan = Subscription::where('user_id', $lockedTx->user_id)
                ->where('plan_id', $lockedTx->plan_id)
                ->whereIn('status', ['active', 'past_due'])
                ->latest('id')
                ->first();

            $renewalAnchor = ($lockedTx->type === 'renewal' && $existingSamePlan?->renews_at && $existingSamePlan->renews_at->isFuture())
                ? $existingSamePlan->renews_at->copy()
                : $paidAt->copy();

            $renewsAt = $this->nextRenewalDate($renewalAnchor, $lockedTx->billing_cycle);
            if ($creditDays > 0) {
                $renewsAt->addDays($creditDays);
            }

            $hasReusableToken = !empty($tokenId);
            $subAttributes = [
                'user_id'              => $lockedTx->user_id,
                'plan_id'              => $lockedTx->plan_id,
                'billing_cycle'        => $lockedTx->billing_cycle,
                'gateway'              => 'squad',
                'squad_token_id'       => $hasReusableToken ? $tokenId : null,
                'last_transaction_ref' => $lockedTx->transaction_ref,
                'auto_renew'           => $hasReusableToken,
                'status'               => 'active',
                'renews_at'            => $renewsAt,
                'ends_at'              => null,
            ];

            if ($lockedTx->type === 'renewal' && $existingSamePlan) {
                $existingSamePlan->update($subAttributes);
                $sub = $existingSamePlan;
            } else {
                // Retire previous cycle on the same plan (e.g. Quarterly -> Yearly) cleanly while keeping audit history
                Subscription::where('user_id', $lockedTx->user_id)
                    ->where('plan_id', $lockedTx->plan_id)
                    ->whereIn('status', ['active', 'past_due'])
                    ->update([
                        'status'     => 'canceled',
                        'auto_renew' => false,
                        'ends_at'    => $paidAt,
                    ]);

                $sub = Subscription::create($subAttributes);
            }

            if ($previousUser) {
                \App\Services\SubscriptionService::syncUsageTrackingForPlanChange($previousUser, $previousSlug);
            }

            return $sub;
        });

        return $subscription;
    }

    public function nextRenewalDate(Carbon $from, string $billingCycle): Carbon
    {
        return match ($billingCycle) {
            'yearly'    => $from->copy()->addYear(),
            'quarterly' => $from->copy()->addMonths(3),
            default     => $from->copy()->addMonths(3),
        };
    }
}
