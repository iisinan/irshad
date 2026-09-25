<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SubscriptionController extends Controller
{
    public function initialize(Request $request)
    {
        $request->validate([
            'plan_slug'     => 'required|string|exists:plans,slug',
            'billing_cycle' => 'required|in:monthly,yearly',
        ]);

        $plan = Plan::where('slug', $request->plan_slug)->first();
        if (!$plan) return response()->json(['error' => 'Plan not found'], 404);

        $user = $request->user();

        // ── Handle downgrade to free ──────────────────────────────────────
        if ($plan->slug === 'free') {
            $this->cancelOnPaystack($user);
            $user->subscriptions()->update(['status' => 'canceled', 'ends_at' => now()]);
            return response()->json(['message' => 'Downgraded to free plan successfully', 'url' => null]);
        }

        // ── Fix #7: Cancel existing active subscription before upgrading ─
        $existingSub = $user->activeSubscription;
        if ($existingSub && $existingSub->paystack_subscription_code) {
            $this->cancelOnPaystack($user);
            $existingSub->update(['status' => 'canceled', 'ends_at' => now()]);
        }

        // ── Resolve or auto-create Paystack plan code ─────────────────────
        $paystackPlanCode = $request->billing_cycle === 'yearly'
            ? $plan->paystack_plan_code_yearly
            : $plan->paystack_plan_code_monthly;

        $amount = $request->billing_cycle === 'yearly' ? $plan->price_yearly : $plan->price_monthly;

        if (!$paystackPlanCode) {
            $planName = $plan->name . ' (' . ucfirst($request->billing_cycle) . ')';
            $interval = $request->billing_cycle === 'yearly' ? 'annually' : 'monthly';

            $createPlanRes = Http::withToken(config('services.paystack.secret'))
                ->post('https://api.paystack.co/plan', [
                    'name'     => $planName,
                    'interval' => $interval,
                    'amount'   => $amount * 100,
                ]);

            if ($createPlanRes->successful() && isset($createPlanRes['data']['plan_code'])) {
                $paystackPlanCode = $createPlanRes['data']['plan_code'];
                if ($request->billing_cycle === 'yearly') {
                    $plan->paystack_plan_code_yearly = $paystackPlanCode;
                } else {
                    $plan->paystack_plan_code_monthly = $paystackPlanCode;
                }
                $plan->save();
            } else {
                Log::error('Failed to auto-create Paystack Plan', ['res' => $createPlanRes->json()]);
                return response()->json(['error' => 'Unable to configure payment plan. Contact support.'], 500);
            }
        }

        // ── Initialize Paystack transaction ───────────────────────────────
        $response = Http::withToken(config('services.paystack.secret'))
            ->post('https://api.paystack.co/transaction/initialize', [
                'email'        => $user->email,
                'amount'       => $amount * 100,
                'plan'         => $paystackPlanCode,
                'callback_url' => config('app.frontend_url') . '/settings/billing/callback',
                'metadata'     => [
                    'user_id'       => $user->id,
                    'plan_id'       => $plan->id,
                    'billing_cycle' => $request->billing_cycle,
                ],
            ]);

        if ($response->successful()) {
            return response()->json([
                'authorization_url' => $response->json('data.authorization_url'),
                'access_code'       => $response->json('data.access_code'),
                'reference'         => $response->json('data.reference'),
            ]);
        }

        Log::error('Paystack Initialization Failed', ['response' => $response->json()]);
        return response()->json(['error' => 'Unable to initialize payment. Please try again.'], 500);
    }

    // ── Fix #4: Proper cancel that disables on Paystack too ───────────────
    public function cancel(Request $request)
    {
        $user = $request->user();
        $sub  = $user->activeSubscription;

        if (!$sub) {
            return response()->json(['message' => 'No active subscription found.'], 404);
        }

        $paystackCanceled = $this->cancelOnPaystack($user);

        $sub->update([
            'status'  => 'canceled',
            'ends_at' => $sub->renews_at ?? now(), // Grace until end of current period
        ]);

        return response()->json([
            'message'           => 'Subscription canceled. You keep access until ' . ($sub->renews_at?->toDateString() ?? 'today') . '.',
            'paystack_canceled' => $paystackCanceled,
        ]);
    }

    // ── Fix #6: Status polling endpoint for BillingCallback ──────────────
    public function status(Request $request)
    {
        $user = $request->user();
        $sub  = $user->activeSubscription;

        return response()->json([
            'has_active_subscription' => (bool) $sub,
            'plan'    => $sub?->plan?->name,
            'slug'    => $sub?->plan?->slug,
            'renews_at' => $sub?->renews_at?->toDateString(),
        ]);
    }

    // ── Webhook (Paystack → us) ───────────────────────────────────────────
    public function webhook(Request $request)
    {
        $signature = $request->header('x-paystack-signature');
        $payload   = $request->getContent();

        if ($signature !== hash_hmac('sha512', $payload, config('services.paystack.secret'))) {
            return response()->json(['status' => 'invalid signature'], 400);
        }

        $event = $request->input('event');
        $data  = $request->input('data');

        match ($event) {
            'subscription.create'  => $this->handleSubscriptionCreated($data),
            'charge.success'       => $this->handleChargeSuccess($data),
            'subscription.disable' => $this->handleSubscriptionDisabled($data),
            default                => null,
        };

        return response()->json(['status' => 'success']);
    }

    public function sendMagicLink(Request $request)
    {
        $user = $request->user();

        \Illuminate\Support\Facades\Mail::raw(
            "Hello {$user->name},\n\nClick the link below to upgrade your Irshad account to Pro or Max and unlock unlimited features!\n\n" . config('app.frontend_url') . "/pricing\n\nThanks,\nThe Irshad Team",
            function ($message) use ($user) {
                $message->to($user->email)->subject('Upgrade your Irshad Account');
            }
        );

        return response()->json(['message' => 'Magic link sent successfully. Check your email!']);
    }

    // ─── Private helpers ──────────────────────────────────────────────────

    private function cancelOnPaystack($user): bool
    {
        $sub = $user->activeSubscription;
        if (!$sub || !$sub->paystack_subscription_code || !$sub->paystack_email_token) {
            return false;
        }

        $res = Http::withToken(config('services.paystack.secret'))
            ->post('https://api.paystack.co/subscription/disable', [
                'code'  => $sub->paystack_subscription_code,
                'token' => $sub->paystack_email_token,
            ]);

        if (!$res->successful()) {
            Log::warning('Paystack subscription disable failed', ['res' => $res->json()]);
        }

        return $res->successful();
    }

    private function handleSubscriptionCreated($data): void
    {
        $email = $data['customer']['email'] ?? null;
        $user  = $email ? \App\Models\User::where('email', $email)->first() : null;
        if (!$user) return;

        $planCode = $data['plan']['plan_code'];
        $plan = Plan::where('paystack_plan_code_monthly', $planCode)
            ->orWhere('paystack_plan_code_yearly', $planCode)
            ->first();
        if (!$plan) return;

        $billingCycle = $plan->paystack_plan_code_yearly === $planCode ? 'yearly' : 'monthly';

        Subscription::updateOrCreate(
            ['user_id' => $user->id, 'plan_id' => $plan->id],
            [
                'billing_cycle'              => $billingCycle,
                'paystack_subscription_code' => $data['subscription_code'],
                'paystack_email_token'       => $data['email_token'],
                'status'                     => 'active',
                'renews_at'                  => Carbon::parse($data['next_payment_date']),
                'ends_at'                    => null,
            ]
        );
    }

    // Fix #3 & #5: Handle charge.success as fallback + update renews_at on renewals
    private function handleChargeSuccess($data): void
    {
        // Only process subscription charges (not one-off)
        $planData = $data['plan'] ?? null;
        if (!$planData) return;

        $email = $data['customer']['email'] ?? null;
        $user  = $email ? \App\Models\User::where('email', $email)->first() : null;
        if (!$user) return;

        $planCode = $planData['plan_code'] ?? null;
        if (!$planCode) return;

        $plan = Plan::where('paystack_plan_code_monthly', $planCode)
            ->orWhere('paystack_plan_code_yearly', $planCode)
            ->first();
        if (!$plan) return;

        $billingCycle = $plan->paystack_plan_code_yearly === $planCode ? 'yearly' : 'monthly';

        // Calculate next renewal based on billing cycle
        $paidAt   = Carbon::parse($data['paid_at'] ?? now());
        $renewsAt = $billingCycle === 'yearly'
            ? $paidAt->addYear()
            : $paidAt->addMonth();

        $subscriptionCode = $data['subscription_code'] ?? ($data['metadata']['subscription_code'] ?? null);

        Subscription::updateOrCreate(
            ['user_id' => $user->id, 'plan_id' => $plan->id],
            [
                'billing_cycle'              => $billingCycle,
                'paystack_subscription_code' => $subscriptionCode,
                'paystack_email_token'       => $data['email_token'] ?? null,
                'status'                     => 'active',
                'renews_at'                  => $renewsAt,
                'ends_at'                    => null,
            ]
        );
    }

    private function handleSubscriptionDisabled($data): void
    {
        $sub = Subscription::where('paystack_subscription_code', $data['subscription_code'])->first();
        if ($sub) {
            $sub->update([
                'status'  => 'canceled',
                'ends_at' => $sub->renews_at,
            ]);
        }
    }
}
