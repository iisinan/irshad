<?php

namespace App\Http\Controllers;

use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Services\SquadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    public function __construct(private readonly SquadService $squad)
    {
    }

    public function initialize(Request $request)
    {
        $request->validate([
            'plan_slug'     => 'required|string|exists:plans,slug',
            'billing_cycle' => 'required|in:quarterly,yearly',
        ]);

        $plan = Plan::where('slug', $request->plan_slug)->firstOrFail();
        $user = $request->user();

        if ($plan->slug === 'free') {
            $user->subscriptions()
                ->where('status', 'active')
                ->update([
                    'status'         => 'canceled',
                    'auto_renew'     => false,
                    'squad_token_id' => null,
                    'ends_at'        => now(),
                ]);

            return response()->json(['message' => 'Downgraded to free plan successfully', 'url' => null]);
        }

        if (!$this->squad->isConfigured()) {
            return response()->json(['error' => 'Payment gateway is not configured yet.'], 503);
        }

        $amountNaira = $plan->priceForCycle($request->billing_cycle);
        $amountKobo  = (int) round($amountNaira * 100);
        if ($amountKobo <= 0) {
            return response()->json(['error' => 'Invalid plan pricing configured.'], 422);
        }

        $transactionRef = 'IRS_' . strtoupper(Str::random(16));

        $transaction = PaymentTransaction::create([
            'user_id'         => $user->id,
            'plan_id'         => $plan->id,
            'billing_cycle'   => $request->billing_cycle,
            'gateway'         => 'squad',
            'transaction_ref' => $transactionRef,
            'amount_kobo'     => $amountKobo,
            'currency'        => 'NGN',
            'status'          => 'pending',
            'type'            => 'initial',
        ]);

        $callbackUrl = rtrim((string) config('app.frontend_url'), '/') . '/settings/billing/callback';

        $init = $this->squad->initiateTransaction(
            $user,
            $amountKobo,
            $transactionRef,
            $callbackUrl,
            [
                'user_id'       => $user->id,
                'plan_id'       => $plan->id,
                'plan_slug'     => $plan->slug,
                'billing_cycle' => $request->billing_cycle,
            ]
        );

        if (!$init['success']) {
            $transaction->update([
                'status'      => 'failed',
                'raw_payload' => $init['body'] ?? null,
            ]);

            return response()->json([
                'error' => 'Unable to initialize payment. Please try again.',
            ], 502);
        }

        return response()->json([
            'authorization_url' => $init['checkout_url'],
            'checkout_url'      => $init['checkout_url'],
            'reference'         => $transactionRef,
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'reference' => 'required|string|max:100',
        ]);

        $user = $request->user();
        $transaction = PaymentTransaction::with('plan')
            ->where('transaction_ref', $request->reference)
            ->where('user_id', $user->id)
            ->first();

        if (!$transaction) {
            return response()->json(['error' => 'Payment reference not found.'], 404);
        }

        if ($transaction->status === 'success') {
            $sub = $user->activeSubscription()->with('plan')->first();
            return response()->json([
                'verified'                => true,
                'status'                  => 'success',
                'has_active_subscription' => (bool) $sub,
                'plan'                    => $sub?->plan?->name ?? $transaction->plan?->name,
                'slug'                    => $sub?->plan?->slug ?? $transaction->plan?->slug,
                'billing_cycle'           => $sub?->billing_cycle ?? $transaction->billing_cycle,
                'renews_at'               => $sub?->renews_at?->toDateString(),
            ]);
        }

        if (!$this->squad->isConfigured()) {
            return response()->json(['error' => 'Payment gateway is not configured yet.'], 503);
        }

        $data = $this->squad->verifyTransaction($transaction->transaction_ref);
        if (!$data) {
            return response()->json([
                'verified' => false,
                'status'   => 'pending',
                'message'  => 'Unable to confirm payment status yet.',
            ], 202);
        }

        $gatewayStatus = strtolower((string) ($data['transaction_status'] ?? ''));
        $paidAmountKobo = (int) ($data['transaction_amount'] ?? 0);

        if ($gatewayStatus === 'success') {
            if ($paidAmountKobo < $transaction->amount_kobo) {
                Log::warning('Squad verified amount mismatch', [
                    'ref'      => $transaction->transaction_ref,
                    'expected' => $transaction->amount_kobo,
                    'actual'   => $paidAmountKobo,
                ]);
                $transaction->update(['status' => 'failed', 'raw_payload' => $data]);
                return response()->json([
                    'verified' => false,
                    'status'   => 'failed',
                    'error'    => 'Paid amount does not match expected plan amount.',
                ], 422);
            }

            $sub = $this->squad->activateFromTransaction($transaction, $data);
            $sub->load('plan');

            return response()->json([
                'verified'                => true,
                'status'                  => 'success',
                'has_active_subscription' => true,
                'plan'                    => $sub->plan?->name,
                'slug'                    => $sub->plan?->slug,
                'billing_cycle'           => $sub->billing_cycle,
                'renews_at'               => $sub->renews_at?->toDateString(),
            ]);
        }

        if (in_array($gatewayStatus, ['failed', 'abandoned'], true)) {
            $transaction->update([
                'status'      => 'failed',
                'raw_payload' => $data,
            ]);

            return response()->json([
                'verified' => false,
                'status'   => 'failed',
                'error'    => 'Payment was not completed.',
            ], 422);
        }

        return response()->json([
            'verified' => false,
            'status'   => 'pending',
            'message'  => 'Payment is still processing.',
        ], 202);
    }

    public function cancel(Request $request)
    {
        $user = $request->user();
        $sub  = $user->subscriptions()->where('status', 'active')->latest('id')->first();

        if (!$sub) {
            return response()->json(['message' => 'No active subscription found.'], 404);
        }

        $endsAt = $sub->renews_at ?? now();

        $sub->update([
            'status'         => 'canceled',
            'auto_renew'     => false,
            'squad_token_id' => null,
            'ends_at'        => $endsAt,
        ]);

        return response()->json([
            'message' => 'Subscription canceled. You keep access until ' . $endsAt->toDateString() . '.',
            'ends_at' => $endsAt->toDateString(),
        ]);
    }

    public function plans()
    {
        return response()->json(Plan::all());
    }

    public function status(Request $request)
    {
        $user = $request->user();
        $sub  = $user->activeSubscription()->with('plan')->first();

        return response()->json([
            'has_active_subscription' => (bool) $sub,
            'plan'                    => $sub?->plan?->name,
            'slug'                    => $sub?->plan?->slug,
            'billing_cycle'           => $sub?->billing_cycle,
            'renews_at'               => $sub?->renews_at?->toDateString(),
            'ends_at'                 => $sub?->ends_at?->toDateString(),
            'auto_renew'              => (bool) ($sub?->auto_renew ?? false),
        ]);
    }

    /**
     * Squad webhook handler (x-squad-encrypted-body HMAC-SHA512 verified).
     */
    public function webhook(Request $request)
    {
        $signature = $request->header('x-squad-encrypted-body');
        $rawPayload = $request->getContent();

        if (!$this->squad->verifyWebhookSignature($rawPayload, $signature)) {
            Log::warning('Invalid Squad webhook signature received');
            return response()->json(['status' => 'invalid signature'], 401);
        }

        $event = strtolower((string) ($request->input('Event') ?? $request->input('event') ?? ''));
        $body  = $request->input('Body') ?? $request->input('data') ?? [];
        $ref   = $request->input('TransactionRef') ?? data_get($body, 'transaction_ref');

        if ($event === 'charge_successful' && $ref) {
            $txStatus = strtolower((string) data_get($body, 'transaction_status', ''));
            if ($txStatus !== 'success') {
                return response()->json(['status' => 'ignored']);
            }

            $transaction = PaymentTransaction::where('transaction_ref', $ref)->first();
            if (!$transaction) {
                Log::warning('Squad webhook received for unknown transaction_ref', ['ref' => $ref]);
                return response()->json(['status' => 'ignored']);
            }

            $paidAmountKobo = (int) (data_get($body, 'amount') ?? data_get($body, 'transaction_amount') ?? 0);
            if ($paidAmountKobo > 0 && $paidAmountKobo < $transaction->amount_kobo) {
                Log::warning('Squad webhook amount mismatch', [
                    'ref'      => $ref,
                    'expected' => $transaction->amount_kobo,
                    'actual'   => $paidAmountKobo,
                ]);
                $transaction->update(['status' => 'failed', 'raw_payload' => $body]);
                return response()->json(['status' => 'amount mismatch'], 422);
            }

            $this->squad->activateFromTransaction($transaction, is_array($body) ? $body : []);
        }

        return response()->json(['status' => 'success']);
    }

    public function sendMagicLink(Request $request)
    {
        $user = $request->user();

        Mail::raw(
            "Hello {$user->name},\n\nClick the link below to upgrade your Irshad account to Rawdha or Noor and unlock unlimited features!\n\n" . rtrim((string) config('app.frontend_url'), '/') . "/pricing\n\nThanks,\nThe Irshad Team",
            function ($message) use ($user) {
                $message->to($user->email)->subject('Upgrade your Irshad Account');
            }
        );

        return response()->json(['message' => 'Magic link sent successfully. Check your email!']);
    }
}
