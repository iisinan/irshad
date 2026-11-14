<?php

namespace App\Console\Commands;

use App\Models\PaymentTransaction;
use App\Models\Subscription;
use App\Models\UserNotification;
use App\Services\SquadService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ChargeSquadRenewals extends Command
{
    protected $signature = 'app:charge-squad-renewals';
    protected $description = 'Charge due tokenized Squad subscriptions and expire canceled/non-renewing ones.';

    public function handle(SquadService $squad): int
    {
        // 1. Mark canceled and past_due grace-period subscriptions as expired once ends_at passes
        $expiredCanceled = Subscription::whereIn('status', ['canceled', 'past_due'])
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', now())
            ->update(['status' => 'expired']);

        if ($expiredCanceled > 0) {
            $this->info("Marked {$expiredCanceled} canceled/past-due subscription(s) as expired.");
        }

        // 2. Expire active subscriptions with auto_renew disabled or missing token when renews_at passes
        $expiredNonRenewing = Subscription::where('status', 'active')
            ->where('renews_at', '<=', now())
            ->where(function ($q) {
                $q->where('auto_renew', false)
                    ->orWhereNull('squad_token_id');
            })
            ->update(['status' => 'expired']);

        if ($expiredNonRenewing > 0) {
            $this->info("Marked {$expiredNonRenewing} non-renewing subscription(s) as expired.");
        }

        if (!$squad->isConfigured()) {
            $this->warn('Squad secret key not configured; skipping renewal charges.');
            return self::SUCCESS;
        }

        // 3. Charge due tokenized Squad subscriptions (including past_due within their 3-day dunning grace window)
        $dueSubscriptions = Subscription::with(['user', 'plan'])
            ->where('gateway', 'squad')
            ->whereIn('status', ['active', 'past_due'])
            ->where('auto_renew', true)
            ->where(function ($q) {
                $q->where(function ($active) {
                    $active->where('status', 'active')->whereNull('ends_at');
                })->orWhere(function ($pastDue) {
                    $pastDue->where('status', 'past_due')
                        ->whereNotNull('ends_at')
                        ->where('ends_at', '>', now());
                });
            })
            ->whereNotNull('squad_token_id')
            ->where('renews_at', '<=', now())
            ->get();

        foreach ($dueSubscriptions as $sub) {
            if (!$sub->user || !$sub->plan) {
                continue;
            }

            // Avoid charging the same subscription multiple times within the same calendar day
            $alreadyTriedToday = PaymentTransaction::where('user_id', $sub->user_id)
                ->where('plan_id', $sub->plan_id)
                ->where('type', 'renewal')
                ->where('created_at', '>=', now()->startOfDay())
                ->exists();

            if ($alreadyTriedToday) {
                continue;
            }

            $amountKobo = (int) round($sub->plan->priceForCycle($sub->billing_cycle) * 100);
            if ($amountKobo <= 0) {
                continue;
            }

            $ref = 'REN_' . strtoupper(Str::random(16));
            $tx = PaymentTransaction::create([
                'user_id'         => $sub->user_id,
                'plan_id'         => $sub->plan_id,
                'billing_cycle'   => $sub->billing_cycle,
                'gateway'         => 'squad',
                'transaction_ref' => $ref,
                'amount_kobo'     => $amountKobo,
                'currency'        => 'NGN',
                'status'          => 'pending',
                'type'            => 'renewal',
            ]);

            $result = $squad->chargeCardToken($sub->user, $amountKobo, $ref, $sub->squad_token_id);

            if ($result['success']) {
                $squad->activateFromTransaction($tx, $result['data']);
                $this->info("Renewed subscription #{$sub->id} (user {$sub->user_id}).");
            } else {
                $tx->update([
                    'status'      => 'failed',
                    'raw_payload' => $result['data'],
                ]);

                $graceEndsAt = ($sub->status === 'past_due' && $sub->ends_at)
                    ? $sub->ends_at
                    : now()->addDays(3);

                $sub->update([
                    'status'  => 'past_due',
                    'ends_at' => $graceEndsAt,
                ]);

                UserNotification::notify(
                    $sub->user_id,
                    'Subscription Renewal Failed',
                    "We could not charge your saved card for {$sub->plan->name}. Your access remains active until {$graceEndsAt->toFormattedDateString()} while we retry. Please renew via Pricing to keep uninterrupted access.",
                    [
                        'icon'         => '⚠️',
                        'category'     => 'billing',
                        'action_url'   => '/pricing',
                        'action_label' => 'Update Plan',
                    ]
                );

                $this->warn("Renewal failed for subscription #{$sub->id}: " . ($result['message'] ?? 'unknown error'));
            }
        }

        return self::SUCCESS;
    }
}
