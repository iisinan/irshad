<?php

namespace App\Console\Commands;

use App\Models\PaymentTransaction;
use App\Models\Subscription;
use App\Models\UserNotification;
use App\Services\SquadService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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

        // 2b. Remind upcoming expiring non-renewing subscriptions (cardless or canceled) 3 days prior
        $windowEnd = now()->addDays(3);
        $expiringSoon = Subscription::with(['user', 'plan'])
            ->where(function ($q) use ($windowEnd) {
                $q->where(function ($activeNoRenew) use ($windowEnd) {
                    $activeNoRenew->where('status', 'active')
                        ->where(function ($r) {
                            $r->where('auto_renew', false)->orWhereNull('squad_token_id');
                        })
                        ->whereBetween('renews_at', [now(), $windowEnd]);
                })->orWhere(function ($canceledEnding) use ($windowEnd) {
                    $canceledEnding->where('status', 'canceled')
                        ->whereNotNull('ends_at')
                        ->whereBetween('ends_at', [now(), $windowEnd]);
                });
            })
            ->get();

        $pricingUrl = rtrim((string) config('app.frontend_url', 'https://iirshad.com'), '/') . '/pricing';
        foreach ($expiringSoon as $sub) {
            if (!$sub->user || !$sub->plan || $sub->plan->slug === 'free') {
                continue;
            }
            $endDate = $sub->ends_at ?? $sub->renews_at;
            if (!$endDate) {
                continue;
            }
            $dedupKey = "sub_expiry_notice:{$sub->id}:{$endDate->toDateString()}";
            if (!Cache::add($dedupKey, true, now()->addDays(4))) {
                continue;
            }

            UserNotification::notify(
                $sub->user_id,
                'Subscription Expiring Soon',
                "Your {$sub->plan->name} plan ends on {$endDate->toFormattedDateString()} and is not set to auto-renew. Renew anytime on {$pricingUrl} to avoid interruption.",
                [
                    'icon'         => '⏳',
                    'category'     => 'billing',
                    'action_url'   => '/pricing',
                    'action_label' => 'Renew Plan',
                ]
            );

            try {
                Mail::raw(
                    "Assalamu Alaikum {$sub->user->name},\n\nYour Irshad {$sub->plan->name} ({$sub->billing_cycle}) subscription will expire on {$endDate->toFormattedDateString()} and does not have auto-renewal enabled.\n\nTo keep uninterrupted access to your quotas and portfolio tools, you can renew your plan here:\n{$pricingUrl}?plan={$sub->plan->slug}&cycle={$sub->billing_cycle}\n\nThank you,\nThe Irshad Team",
                    function ($message) use ($sub) {
                        $message->to($sub->user->email)->subject("Your Irshad {$sub->plan->name} plan expires soon");
                    }
                );
            } catch (\Throwable $e) {
                Log::warning("Failed sending expiry reminder email for subscription #{$sub->id}: {$e->getMessage()}");
            }
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

                try {
                    Mail::raw(
                        "Assalamu Alaikum {$sub->user->name},\n\nWe could not process the automatic renewal payment for your Irshad {$sub->plan->name} ({$sub->billing_cycle}) subscription.\n\nYour paid access remains active during a grace window until {$graceEndsAt->toFormattedDateString()}. Please complete payment to avoid interruption:\n{$pricingUrl}?plan={$sub->plan->slug}&cycle={$sub->billing_cycle}\n\nThank you,\nThe Irshad Team",
                        function ($message) use ($sub) {
                            $message->to($sub->user->email)->subject("Action required: Irshad {$sub->plan->name} renewal failed");
                        }
                    );
                } catch (\Throwable $e) {
                    Log::warning("Failed sending renewal failure email for subscription #{$sub->id}: {$e->getMessage()}");
                }

                $this->warn("Renewal failed for subscription #{$sub->id}: " . ($result['message'] ?? 'unknown error'));
            }
        }

        return self::SUCCESS;
    }
}
