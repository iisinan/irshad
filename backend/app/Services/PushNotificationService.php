<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Send push notification to a specific user.
     */
    public function sendToUser(User $user, string $title, string $body, array $data = []): bool
    {
        if (empty($user->fcm_token)) {
            Log::info("Skipping push notification for user {$user->id}: No fcm_token set.");
            return false;
        }

        return $this->sendToToken($user->fcm_token, $title, $body, $data);
    }

    /**
     * Send push notification directly to an FCM device token.
     */
    public function sendToToken(string $token, string $title, string $body, array $data = []): bool
    {
        try {
            $stringData = [];
            foreach ($data as $key => $value) {
                if (is_array($value) || is_object($value)) {
                    $stringData[$key] = json_encode($value);
                } else {
                    $stringData[$key] = (string) $value;
                }
            }
            $stringData['click_action'] = 'FLUTTER_NOTIFICATION_CLICK';

            $this->notificationService->sendDirectPushNotification($token, [
                'title' => $title,
                'body'  => $body,
                'data'  => $stringData,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error("PushNotificationService failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send direct push notification (alias for compatibility).
     */
    public function sendDirectPushNotification(string $token, array $notification): void
    {
        $this->notificationService->sendDirectPushNotification($token, $notification);
    }
}
