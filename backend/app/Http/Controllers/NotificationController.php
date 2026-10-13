<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /v1/notifications/inbox
     * Return the authenticated user's inbox with optional filtering.
     */
    public function inbox(Request $request): JsonResponse
    {
        $query = UserNotification::where('user_id', auth()->id())
            ->whereNull('archived_at')
            ->orderBy('created_at', 'desc');

        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->has('unread') && $request->boolean('unread')) {
            $query->whereNull('read_at');
        }

        if ($request->has('search') && strlen($request->search) > 1) {
            $search = '%'.$request->search.'%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                    ->orWhere('message', 'like', $search);
            });
        }

        $notifications = $query->paginate(20);
        $unreadCount = UserNotification::where('user_id', auth()->id())
            ->whereNull('read_at')
            ->whereNull('archived_at')
            ->count();

        return response()->json([
            'data' => $notifications->items(),
            'unread_count' => $unreadCount,
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    /**
     * PUT /v1/notifications/{id}/read
     * Mark a single notification as read.
     */
    public function markRead(int $id): JsonResponse
    {
        $notification = UserNotification::where('user_id', auth()->id())->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Marked as read']);
    }

    /**
     * PUT /v1/notifications/read-all
     * Mark all of the user's notifications as read.
     */
    public function markAllRead(): JsonResponse
    {
        UserNotification::where('user_id', auth()->id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * DELETE /v1/notifications/{id}
     * Delete a single notification.
     */
    public function destroy(int $id): JsonResponse
    {
        UserNotification::where('user_id', auth()->id())->findOrFail($id)->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    /**
     * PUT /v1/notifications/{id}/archive
     * Archive a notification.
     */
    public function archive(int $id): JsonResponse
    {
        $notification = UserNotification::where('user_id', auth()->id())->findOrFail($id);
        $notification->update(['archived_at' => now()]);

        return response()->json(['message' => 'Notification archived']);
    }

    /**
     * GET /v1/notifications/unread-count
     * Return only the unread count (lightweight, for polling).
     */
    public function unreadCount(): JsonResponse
    {
        $count = UserNotification::where('user_id', auth()->id())
            ->whereNull('read_at')
            ->whereNull('archived_at')
            ->count();

        return response()->json(['data' => ['count' => $count]]);
    }

    /**
     * POST /v1/notifications/test
     * Dispatch an immediate test notification to the user's phone and inbox.
     */
    public function sendTestNotification(Request $request): JsonResponse
    {
        $user = $request->user();
        $title = $request->input('title', 'Irshad Test Alert 🔔');
        $message = $request->input('message', 'Your mobile notifications are successfully connected and working!');

        // 1. Create in-app notification
        $notification = UserNotification::notify($user->id, $title, $message, [
            'icon' => '🔔',
            'category' => 'system',
            'meta' => ['type' => 'test'],
        ]);

        // 2. Dispatch push notification if device token is present
        $pushSent = false;
        if (!empty($user->fcm_token)) {
            $pushService = app(\App\Services\PushNotificationService::class);
            $pushSent = $pushService->sendToUser($user, $title, $message, [
                'type' => 'test',
                'notification_id' => (string) $notification->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $pushSent 
                ? 'Test notification sent to your phone!' 
                : 'In-app notification created. To receive phone alerts, ensure push notifications are allowed on your device.',
            'push_sent' => $pushSent,
            'notification' => $notification,
        ]);
    }
}
