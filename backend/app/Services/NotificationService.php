<?php

namespace App\Services;

use App\Jobs\NotifyUsersOfAssetChange;
use App\Models\ComplianceStatusChange;
use App\Models\Favorite;
use App\Models\Holding;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\Watchlist;
use Google\Client as GoogleClient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send a notification to users who hold or track an item when its status changes.
     */
    public function notifyStatusChange(string $type, $item, string $oldStatus, string $newStatus)
    {
        $oldNorm = strtolower($oldStatus ?? '');
        $newNorm = strtolower($newStatus ?? '');

        $isNewNonHalal = in_array($newNorm, ['non_halal', 'non-halal', 'non-compliant', 'non_compliant', 'fail']);
        $isNewHalal = in_array($newNorm, ['halal', 'compliant', 'shariah compliant', 'pass']);

        $reason = $type === 'product' ? $item->status_reason : ($item->status()->first()?->reason ?? 'a recent compliance review');

        if ($type === 'stock' && $item) {
            // 1. Manage 90-day grace period for holdings
            if ($isNewNonHalal) {
                Holding::where('symbol', $item->symbol)
                    ->whereNull('grace_period_ends_at')
                    ->update([
                        'grace_period_ends_at' => now()->addDays(90),
                        'grace_period_notified' => false,
                    ]);
            } elseif ($isNewHalal) {
                Holding::where('symbol', $item->symbol)
                    ->whereNotNull('grace_period_ends_at')
                    ->update([
                        'grace_period_ends_at' => null,
                        'grace_period_notified' => false,
                    ]);
            }

            // 2. Invalidate portfolio cache for users holding this stock
            $holdingUserIds = Holding::where('symbol', $item->symbol)->pluck('user_id')->unique();
            foreach ($holdingUserIds as $uId) {
                Cache::forget("portfolio_data_{$uId}");
            }

            // 3. Log compliance status change for the Updates feed
            $alreadyLogged = ComplianceStatusChange::where('company_id', $item->id)
                ->where('new_status', $newStatus)
                ->where('created_at', '>=', now()->subMinutes(5))
                ->exists();

            if (! $alreadyLogged) {
                ComplianceStatusChange::create([
                    'company_id' => $item->id,
                    'previous_status' => $oldStatus,
                    'new_status' => $newStatus,
                    'reason' => $reason,
                    'report_url' => null,
                    'updated_at_change' => now(),
                ]);
            }

            // 4. Collect affected users across Holdings, Watchlists, and Favorites
            $watchlistUserIds = Watchlist::where('symbol', $item->symbol)
                ->where('alert_verdict_change', true)
                ->pluck('user_id');

            $favoritedUserIds = Favorite::where('type', 'stock')
                ->where('reference_id', $item->id)
                ->pluck('user_id');

            $allTargetUserIds = $holdingUserIds->merge($watchlistUserIds)->merge($favoritedUserIds)->unique()->filter()->values();

            // 5. Create in-app notifications
            $holdingUserSet = $holdingUserIds->flip();
            foreach ($allTargetUserIds as $uId) {
                $isHolder = isset($holdingUserSet[$uId]);
                $icon = $isNewNonHalal ? '⚠️' : '✅';
                $title = "{$item->symbol} – Status Changed";

                if ($isHolder && $isNewNonHalal) {
                    $body = "{$item->symbol} in your portfolio has been reclassified as " . strtoupper($newStatus) . ". A 90-day grace period has been assigned to plan your exit.";
                } else {
                    $body = "{$item->symbol} has been reclassified from " . ucfirst($oldStatus ?: 'Unknown') . " to " . strtoupper($newStatus) . ". Reason: {$reason}";
                }

                UserNotification::notify($uId, $title, $body, [
                    'icon' => $icon,
                    'category' => 'screening',
                    'action_url' => "/market/{$item->symbol}",
                    'action_label' => 'View Report',
                    'meta' => [
                        'symbol' => $item->symbol,
                        'previous_status' => $oldStatus,
                        'new_status' => $newStatus,
                        'is_holding' => $isHolder,
                    ],
                ]);
            }

            // 6. Push notifications (FCM)
            $usersWithFcm = User::whereIn('id', $allTargetUserIds)->whereNotNull('fcm_token')->get();
            foreach ($usersWithFcm as $user) {
                $isHolder = isset($holdingUserSet[$user->id]);
                $pushBody = $isHolder && $isNewNonHalal
                    ? "{$item->symbol} in your portfolio is now NON-COMPLIANT. A 90-day grace period has been assigned."
                    : "{$item->symbol} has been reclassified as " . strtoupper($newStatus) . ". Tap to view report.";

                $this->sendPushNotification($user->fcm_token, [
                    'title' => "{$item->symbol} Verdict Changed",
                    'body' => $pushBody,
                    'data' => [
                        'type' => 'compliance',
                        'symbol' => $item->symbol,
                        'reference_id' => (string) $item->id,
                        'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    ],
                ]);
            }
        } else {
            // Product handling
            $favoritedUserIds = Favorite::where('type', 'product')
                ->where('reference_id', $item->id)
                ->pluck('user_id');

            $users = User::whereIn('id', $favoritedUserIds)->whereNotNull('fcm_token')->get();
            foreach ($users as $user) {
                $this->sendPushNotification($user->fcm_token, [
                    'title' => 'Update on ' . $item->name,
                    'body' => $item->name . ' has been reclassified as ' . strtoupper($newStatus) . '. Reason: ' . $reason,
                    'data' => [
                        'type' => 'product',
                        'reference_id' => (string) $item->id,
                        'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    ],
                ]);
            }
        }

        // Also dispatch Email and WhatsApp alerts via the background job
        NotifyUsersOfAssetChange::dispatch($item, $oldStatus, $newStatus, $type);
    }

    /**
     * Get OAuth 2.0 token for FCM v1 using Google API Client.
     */
    private function getAccessToken(): ?string
    {
        try {
            $client = new GoogleClient();
            
            // Support for raw JSON from env (useful for Railway/Forge)
            $rawJson = env('FIREBASE_CREDENTIALS');
            if ($rawJson) {
                $client->setAuthConfig(json_decode($rawJson, true));
            } else {
                $credentialsPath = env('GOOGLE_APPLICATION_CREDENTIALS');
                if (!$credentialsPath || !file_exists($credentialsPath)) {
                    Log::warning("FCM Error: Neither FIREBASE_CREDENTIALS nor valid GOOGLE_APPLICATION_CREDENTIALS set.");
                    return null;
                }
                $client->setAuthConfig($credentialsPath);
            }
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            $client->fetchAccessTokenWithAssertion();
            $token = $client->getAccessToken();
            return $token['access_token'] ?? null;
        } catch (\Exception $e) {
            Log::error("FCM Token Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Send push notification via FCM v1 API.
     */
    protected function sendPushNotification(string $token, array $notification)
    {
        Log::info("Sending push notification to token: {$token}", $notification);

        $projectId = env('FCM_PROJECT_ID');
        if (!$projectId) {
            Log::warning("FCM Error: FCM_PROJECT_ID is not set in .env.");
            return;
        }

        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            Log::warning("FCM Error: Could not get access token.");
            return;
        }

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                'message' => [
                    'token' => $token,
                    'notification' => [
                        'title' => $notification['title'],
                        'body' => $notification['body'],
                    ],
                    'data' => array_map(fn($v) => is_scalar($v) ? (string)$v : json_encode($v), $notification['data'] ?? []),
                    'android' => [
                        'priority' => 'high',
                        'notification' => [
                            'channel_id' => 'irshad_alerts_channel',
                            'sound' => 'default',
                            'default_sound' => true,
                            'default_vibrate_timings' => true,
                        ]
                    ],
                    'apns' => [
                        'payload' => [
                            'aps' => [
                                'sound' => 'default',
                            ]
                        ]
                    ]
                ]
            ]);

        if ($response->successful()) {
            Log::info("FCM Success: Notification sent successfully to {$token}");
        } else {
            Log::error("FCM Failed: " . $response->body());
        }
    }

    /**
     * Send direct push notification to a specific token.
     */
    public function sendDirectPushNotification(string $token, array $notification)
    {
        $this->sendPushNotification($token, $notification);
    }

}
