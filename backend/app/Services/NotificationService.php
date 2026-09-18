<?php

namespace App\Services;

use App\Jobs\NotifyUsersOfAssetChange;
use App\Models\Favorite;
use App\Models\User;
use Google\Client as GoogleClient;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send a notification to users who have an item in their favorites.
     */
    public function notifyStatusChange(string $type, $item, string $oldStatus, string $newStatus)
    {
        $favoritedUserIds = Favorite::where('type', $type === 'product' ? 'product' : 'stock')
            ->where('reference_id', $item->id)
            ->pluck('user_id');

        $users = User::whereIn('id', $favoritedUserIds)->whereNotNull('fcm_token')->get();

        foreach ($users as $user) {
            $reason = $type === 'product' ? $item->status_reason : ($item->status()->first()?->reason ?? 'a recent compliance review');
            $this->sendPushNotification($user->fcm_token, [
                'title' => 'Update on '.($type === 'product' ? $item->name : $item->symbol),
                'body' => ($type === 'product' ? $item->name : $item->symbol).' has been reclassified as '.strtoupper($newStatus).'. Reason: '.$reason,
                'data' => [
                    'type' => $type,
                    'reference_id' => (string) $item->id,
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                ],
            ]);
        }

        // Also dispatch the Email and WhatsApp alerts via the background job
        NotifyUsersOfAssetChange::dispatch($item, $oldStatus, $newStatus, $type);
    }

    /**
     * Get OAuth 2.0 token for FCM v1 using Google API Client.
     */
    private function getAccessToken(): ?string
    {
        $credentialsPath = env('GOOGLE_APPLICATION_CREDENTIALS');

        if (!$credentialsPath || !file_exists($credentialsPath)) {
            Log::warning("FCM Error: GOOGLE_APPLICATION_CREDENTIALS not set or file missing.");
            return null;
        }

        try {
            $client = new GoogleClient();
            $client->setAuthConfig($credentialsPath);
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
                    'data' => $notification['data'] ?? [],
                    'android' => [
                        'priority' => 'high',
                        'notification' => [
                            'sound' => 'default',
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
