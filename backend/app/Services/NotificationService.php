<?php

namespace App\Services;

use App\Models\User;
use App\Models\Favorite;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Jobs\NotifyUsersOfAssetChange;

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
            $this->sendPushNotification($user->fcm_token, [
                'title' => "Update on " . ($type === 'product' ? $item->name : $item->symbol),
                'body' => ($type === 'product' ? $item->name : $item->symbol) . " has been reclassified as " . strtoupper($newStatus) . " due to " . ($item->status_reason ?? $item->reason),
                'data' => [
                    'type' => $type,
                    'reference_id' => $item->id,
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                ]
            ]);
        }

        // Also dispatch the Email and WhatsApp alerts via the background job
        NotifyUsersOfAssetChange::dispatch($item, $oldStatus, $newStatus, $type);
    }

    /**
     * Send push notification via FCM (Placeholder logic).
     */
    protected function sendPushNotification(string $token, array $notification)
    {
        // Placeholder for FCM v1 API call
        Log::info("Sending push notification to token: {$token}", $notification);
        
        // Example:
        // Http::withToken(config('services.fcm.key'))
        //     ->post('https://fcm.googleapis.com/v1/projects/' . config('services.fcm.project_id') . '/messages:send', [
        //         'message' => [
        //             'token' => $token,
        //             'notification' => [
        //                 'title' => $notification['title'],
        //                 'body' => $notification['body'],
        //             ],
        //             'data' => $notification['data'],
        //         ]
        //     ]);
    }
}
