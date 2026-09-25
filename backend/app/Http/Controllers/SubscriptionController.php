<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    public function initialize(Request $request)
    {
        $request->validate([
            'plan_slug' => 'required|string|exists:plans,slug',
            'billing_cycle' => 'required|in:monthly,yearly',
        ]);

        $plan = Plan::where('slug', $request->plan_slug)->first();
        if (!$plan) return response()->json(['error' => 'Plan not found'], 404);

        $paystackPlanCode = $request->billing_cycle === 'yearly' 
            ? $plan->paystack_plan_code_yearly 
            : $plan->paystack_plan_code_monthly;

        if (!$paystackPlanCode) {
            // If they are picking the free plan, just downgrade them
            if ($plan->slug === 'free') {
                $user = $request->user();
                $user->subscriptions()->update(['status' => 'canceled']);
                return response()->json(['message' => 'Downgraded to free plan successfully', 'url' => null]);
            }
            return response()->json(['error' => 'Invalid plan configuration'], 400);
        }

        $user = $request->user();
        $amount = $request->billing_cycle === 'yearly' ? $plan->price_yearly : $plan->price_monthly;
        
        $response = Http::withToken(config('services.paystack.secret'))
            ->post('https://api.paystack.co/transaction/initialize', [
                'email' => $user->email,
                'amount' => $amount * 100, // Paystack uses kobo
                'plan' => $paystackPlanCode,
                'callback_url' => config('app.frontend_url') . '/settings/billing/callback',
                'metadata' => [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'billing_cycle' => $request->billing_cycle,
                ]
            ]);

        if ($response->successful()) {
            return response()->json([
                'authorization_url' => $response->json('data.authorization_url'),
                'access_code' => $response->json('data.access_code'),
                'reference' => $response->json('data.reference'),
            ]);
        }

        Log::error('Paystack Initialization Failed', ['response' => $response->json()]);
        return response()->json(['error' => 'Unable to initialize payment'], 500);
    }

    public function webhook(Request $request)
    {
        // Only accept requests from Paystack IPs in production, or verify signature
        $signature = $request->header('x-paystack-signature');
        $payload = $request->getContent();
        
        if ($signature !== hash_hmac('sha512', $payload, config('services.paystack.secret'))) {
            return response()->json(['status' => 'invalid signature'], 400);
        }

        $event = $request->input('event');
        $data = $request->input('data');

        if ($event === 'subscription.create') {
            $this->handleSubscriptionCreated($data);
        } elseif ($event === 'charge.success') {
            $this->handleChargeSuccess($data);
        } elseif ($event === 'subscription.disable') {
            $this->handleSubscriptionDisabled($data);
        }

        return response()->json(['status' => 'success']);
    }

    public function sendMagicLink(Request $request)
    {
        $user = $request->user();
        
        // In a real production app, we would use a Mailable.
        // For now, we will just use the Notification system or basic Mail facade.
        \Illuminate\Support\Facades\Mail::raw(
            "Hello {$user->name},\n\nClick the link below to upgrade your Irshad account to Pro or Max and unlock unlimited features!\n\n" . config('app.frontend_url') . "/pricing\n\nThanks,\nThe Irshad Team",
            function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Upgrade your Irshad Account');
            }
        );

        return response()->json(['message' => 'Magic link sent successfully. Check your email!']);
    }

    private function handleSubscriptionCreated($data)
    {
        // Paystack sends back the subscription code
        $email = $data['customer']['email'];
        $user = \App\Models\User::where('email', $email)->first();
        if (!$user) return;

        // Find which plan this maps to
        $planCode = $data['plan']['plan_code'];
        $plan = Plan::where('paystack_plan_code_monthly', $planCode)
            ->orWhere('paystack_plan_code_yearly', $planCode)
            ->first();

        if (!$plan) return;

        $billingCycle = $plan->paystack_plan_code_yearly === $planCode ? 'yearly' : 'monthly';

        Subscription::updateOrCreate(
            ['user_id' => $user->id, 'plan_id' => $plan->id],
            [
                'billing_cycle' => $billingCycle,
                'paystack_subscription_code' => $data['subscription_code'],
                'paystack_email_token' => $data['email_token'],
                'status' => 'active',
                'renews_at' => \Carbon\Carbon::parse($data['next_payment_date']),
            ]
        );
    }

    private function handleChargeSuccess($data)
    {
        // Not strictly necessary for subscriptions as subscription.create/update covers it,
        // but useful for tracking first-time payments if needed.
    }

    private function handleSubscriptionDisabled($data)
    {
        $sub = Subscription::where('paystack_subscription_code', $data['subscription_code'])->first();
        if ($sub) {
            $sub->update([
                'status' => 'canceled',
                'ends_at' => $sub->renews_at, // They still have access until the period ends
            ]);
        }
    }
}
