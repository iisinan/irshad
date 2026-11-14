<?php

namespace App\Console\Commands;

use App\Models\PaymentTransaction;
use App\Models\Subscription;
use App\Services\SquadService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ChargeSquadRenewals extends Command
{
    protected $signature = 'app:charge-squad-renewals';
    protected $description = 'Charge due tokenized Squad subscriptions and expire canceled/non-renewing ones.';

    public function handle(SquadService $squad): int
    {
        // 1. Mark canceled grace-period subscriptions as expired once ends_at passes
        $expiredCanceled = Subscription::where('status', 'canceled')
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', now())
            ->update(['status' => 'expired']);

        if ($expiredCanceled > 0) {
            $this->info("Marked {$expiredCanceled} canceled subscription(s) as expired.");
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

        // 3. Charge due tokenized Squad subscriptions
        $dueSubscriptions = Subscription::with(['user', 'plan'])
            ->where('gateway', 'squad')
            ->where('status', 'active')
            ->where('auto_renew', true)
            ->whereNull('ends_at')
            ->whereNotNull('squad_token_id')
            ->where('renews_at', '<=', now())
            ->get();

        foreach ($dueSubscriptions as $sub) {
            if (!$sub->user || !$sub->plan) {
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
                $sub->update(['status' => 'past_due']);
                $this->warn("Renewal failed for subscription #{$sub->id}: " . ($result['message'] ?? 'unknown error'));
            }
        }

        return self::SUCCESS;
    }
}
