<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SesWebhookController extends Controller
{
    /**
     * Handle incoming Amazon SES / SNS notifications for bounces, complaints, and subscription confirmations.
     */
    public function handle(Request $request)
    {
        $payload = json_decode($request->getContent(), true) ?: $request->all();

        if (empty($payload)) {
            return response()->json(['error' => 'Empty payload'], 400);
        }

        $type = $payload['Type'] ?? null;

        // 1. Automatically confirm Amazon SNS subscription
        if ($type === 'SubscriptionConfirmation' && ! empty($payload['SubscribeURL'])) {
            $subscribeUrl = $payload['SubscribeURL'];
            Log::info("Amazon SES SNS Subscription Confirmation received. Confirming via: {$subscribeUrl}");

            try {
                Http::timeout(10)->get($subscribeUrl);
                Log::info("Amazon SES SNS Subscription successfully confirmed.");
                return response()->json(['status' => 'confirmed'], 200);
            } catch (\Throwable $e) {
                Log::error("Failed to auto-confirm Amazon SES SNS subscription: " . $e->getMessage());
                return response()->json(['error' => 'Confirmation failed'], 500);
            }
        }

        // 2. Process SES Notifications (Bounces, Complaints, Deliveries)
        if ($type === 'Notification' && ! empty($payload['Message'])) {
            $message = is_string($payload['Message']) ? json_decode($payload['Message'], true) : $payload['Message'];

            if (! is_array($message)) {
                return response()->json(['status' => 'ignored'], 200);
            }

            $notificationType = $message['notificationType'] ?? ($message['eventType'] ?? null);

            match ($notificationType) {
                'Bounce' => $this->handleBounce($message),
                'Complaint' => $this->handleComplaint($message),
                default => Log::info("Amazon SES Notification received: {$notificationType}"),
            };

            return response()->json(['status' => 'processed'], 200);
        }

        return response()->json(['status' => 'ignored'], 200);
    }

    /**
     * Handle email bounce events to keep AWS bounce rate healthy.
     */
    protected function handleBounce(array $message): void
    {
        $bounce = $message['bounce'] ?? [];
        $bounceType = $bounce['bounceType'] ?? 'Unknown';
        $bouncedRecipients = $bounce['bouncedRecipients'] ?? [];

        Log::warning("Amazon SES Bounce event received: [{$bounceType}]", $bounce);

        // Only flag permanent (hard) bounces
        if ($bounceType === 'Permanent') {
            foreach ($bouncedRecipients as $recipient) {
                $email = strtolower(trim($recipient['emailAddress'] ?? ''));
                if (! $email) {
                    continue;
                }

                try {
                    $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
                    if ($user) {
                        $prefs = $user->preferences ?? [];
                        $prefs['email_bounced'] = true;
                        $prefs['bounced_at'] = now()->toIso8601String();
                        $prefs['bounce_reason'] = $recipient['diagnosticCode'] ?? 'Permanent bounce';
                        $user->preferences = $prefs;
                        $user->save();

                        Log::notice("User [{$user->id}] {$email} marked as email_bounced due to permanent bounce.");
                    }
                } catch (\Throwable $e) {
                    Log::error("Failed to update bounced user {$email}: " . $e->getMessage());
                }
            }
        }
    }

    /**
     * Handle spam complaint events to protect AWS sender reputation.
     */
    protected function handleComplaint(array $message): void
    {
        $complaint = $message['complaint'] ?? [];
        $complainedRecipients = $complaint['complainedRecipients'] ?? [];

        Log::alert("Amazon SES Complaint event received!", $complaint);

        foreach ($complainedRecipients as $recipient) {
            $email = strtolower(trim($recipient['emailAddress'] ?? ''));
            if (! $email) {
                continue;
            }

            try {
                $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
                if ($user) {
                    $prefs = $user->preferences ?? [];
                    $prefs['email_complaint'] = true;
                    $prefs['email_unsubscribed'] = true;
                    $prefs['complained_at'] = now()->toIso8601String();
                    $user->preferences = $prefs;
                    $user->save();

                    Log::notice("User [{$user->id}] {$email} unsubscribed due to spam complaint.");
                }
            } catch (\Throwable $e) {
                Log::error("Failed to update complained user {$email}: " . $e->getMessage());
            }
        }
    }
}
