<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get all stock symbols the user has actively selected alerts for.
     */
    protected function getUserSelectedAlertSymbols(int $userId): array
    {
        // 1. Active Price Alerts
        $priceAlertSymbols = \App\Models\PriceAlert::where('user_id', $userId)
            ->where('is_active', true)
            ->with('company')
            ->get()
            ->pluck('company.symbol')
            ->filter()
            ->map(fn($s) => strtoupper(trim($s)))
            ->toArray();

        // 2. Watchlist stocks where alerts are enabled
        $watchlistSymbols = \App\Models\Watchlist::where('user_id', $userId)
            ->where(function ($q) {
                $q->where('alert_inapp', true)
                  ->orWhere('alert_push', true)
                  ->orWhere('alert_verdict_change', true)
                  ->orWhere('alert_compliance_risk', true)
                  ->orWhere('alert_price_change', true);
            })
            ->pluck('symbol')
            ->filter()
            ->map(fn($s) => strtoupper(trim($s)))
            ->toArray();

        // 3. Portfolio Holdings (for dividend/portfolio notifications on stocks user owns)
        $holdingSymbols = \App\Models\Holding::where('user_id', $userId)
            ->pluck('symbol')
            ->filter()
            ->map(fn($s) => strtoupper(trim($s)))
            ->toArray();

        return array_values(array_unique(array_merge($priceAlertSymbols, $watchlistSymbols, $holdingSymbols)));
    }

    /**
     * Helper: Extract stock symbol from notification meta, action_url, title, or message.
     */
    public static function extractSymbol(UserNotification $notification): ?string
    {
        if (!empty($notification->meta) && is_array($notification->meta) && !empty($notification->meta['symbol'])) {
            return strtoupper(trim($notification->meta['symbol']));
        }
        if (!empty($notification->action_url)) {
            if (preg_match('#/(?:stocks|market)/([A-Za-z0-9\.]+)#i', $notification->action_url, $m)) {
                return strtoupper(trim($m[1]));
            }
        }
        if (!empty($notification->title)) {
            if (preg_match('/[:—\-]\s*([A-Za-z0-9\.]+)\b/', $notification->title, $m)) {
                $cand = strtoupper(trim(preg_replace('/[^\w\.]/', '', $m[1])));
                if (strlen($cand) >= 2 && strlen($cand) <= 10 && !in_array($cand, ['STATUS', 'CHANGED', 'RISK', 'WARNING'])) {
                    return $cand;
                }
            }
            if (preg_match('/^([A-Za-z0-9\.]+)\s*[:—\-]/', $notification->title, $m)) {
                $cand = strtoupper(trim(preg_replace('/[^\w\.]/', '', $m[1])));
                if (strlen($cand) >= 2 && strlen($cand) <= 10) {
                    return $cand;
                }
            }
        }
        return null;
    }

    /**
     * GET /v1/notifications/inbox
     * Return the authenticated user's inbox with optional filtering.
     * Only displays notifications that correspond to what the user selected for alerts.
     */
    public function inbox(Request $request): JsonResponse
    {
        $userId = auth()->id();
        if (!$userId) {
            return response()->json([
                'data' => [],
                'unread_count' => 0,
                'pagination' => ['current_page' => 1, 'last_page' => 1, 'total' => 0],
            ]);
        }

        $selectedSymbols = $this->getUserSelectedAlertSymbols($userId);

        $query = UserNotification::where('user_id', $userId)
            ->whereNull('archived_at')
            ->where(function ($q) {
                $q->whereNull('meta->type')
                  ->orWhere('meta->type', '!=', 'test');
            })
            ->orderBy('created_at', 'desc');

        if ($request->has('category') && $request->category !== 'all') {
            $cat = $request->category;
            $query->where(function ($q) use ($cat) {
                $q->where('category', $cat);
                if ($cat === 'price_alerts') {
                    $q->orWhere('title', 'like', '%Price%')
                      ->orWhere('title', 'like', '%Target%');
                } elseif ($cat === 'screening') {
                    $q->orWhere('title', 'like', '%Compliance%')
                      ->orWhere('title', 'like', '%AAOIFI%')
                      ->orWhere('title', 'like', '%Risk%');
                } elseif ($cat === 'digest') {
                    $q->orWhere('title', 'like', '%Digest%');
                } elseif ($cat === 'portfolio') {
                    $q->orWhere('title', 'like', '%Dividend%')
                      ->orWhere('title', 'like', '%Portfolio%');
                }
            });
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

        $all = $query->get();

        // Enforce that any stock-specific notification MUST match what the user selected for alerts
        $filtered = $all->filter(function ($notification) use ($selectedSymbols) {
            $symbol = self::extractSymbol($notification);
            if ($symbol !== null) {
                return in_array($symbol, $selectedSymbols, true);
            }
            // General system announcement without a specific stock symbol
            return in_array($notification->category, ['system', 'digest']);
        })->values();

        $page = max(1, (int) $request->input('page', 1));
        $perPage = 20;
        $total = $filtered->count();
        $items = $filtered->forPage($page, $perPage)->values();
        $lastPage = max(1, (int) ceil($total / $perPage));

        $unreadCount = $filtered->whereNull('read_at')->count();

        return response()->json([
            'data' => $items,
            'unread_count' => $unreadCount,
            'pagination' => [
                'current_page' => $page,
                'last_page' => $lastPage,
                'total' => $total,
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
     * Return only the unread count (lightweight, for polling), respecting user's selected alerts.
     */
    public function unreadCount(): JsonResponse
    {
        $userId = auth()->id();
        if (!$userId) {
            return response()->json(['data' => ['count' => 0]]);
        }

        $selectedSymbols = $this->getUserSelectedAlertSymbols($userId);

        $notifications = UserNotification::where('user_id', $userId)
            ->whereNull('read_at')
            ->whereNull('archived_at')
            ->where(function ($q) {
                $q->whereNull('meta->type')
                  ->orWhere('meta->type', '!=', 'test');
            })
            ->get();

        $count = $notifications->filter(function ($n) use ($selectedSymbols) {
            $symbol = self::extractSymbol($n);
            if ($symbol !== null) {
                return in_array($symbol, $selectedSymbols, true);
            }
            return in_array($n->category, ['system', 'digest']);
        })->count();

        return response()->json(['data' => ['count' => $count]]);
    }

    /**
     * DELETE /v1/notifications/clear-all
     * Clear all notifications for the authenticated user.
     */
    public function clearAll(): JsonResponse
    {
        UserNotification::where('user_id', auth()->id())->delete();

        return response()->json(['message' => 'All notifications cleared']);
    }

    /**
     * POST /v1/notifications/test
     * Dispatch an immediate test notification to the user's phone and inbox.
     */
    public function sendTestNotification(Request $request): JsonResponse
    {
        $user = $request->user();
        $title = $request->input('title', 'Price Target Alert: DANGCEM 🎯');
        $message = $request->input('message', 'DANGCEM reached your target price of ₦650.00! Current price: ₦655.00.');
        $category = $request->input('category', 'price_alerts');
        $actionUrl = $request->input('action_url', '/stocks/DANGCEM');
        $actionLabel = $request->input('action_label', 'View Stock (DANGCEM)');
        $meta = $request->input('meta', ['symbol' => 'DANGCEM', 'target_price' => 650.0, 'current_price' => 655.0]);

        // 1. Create in-app notification
        $notification = UserNotification::notify($user->id, $title, $message, [
            'icon' => $request->input('icon', '📈'),
            'category' => $category,
            'action_url' => $actionUrl,
            'action_label' => $actionLabel,
            'meta' => $meta,
        ]);

        // 2. Dispatch push notification if device token is present
        $pushSent = false;
        if (!empty($user->fcm_token)) {
            $pushService = app(\App\Services\PushNotificationService::class);
            $pushSent = $pushService->sendToUser($user, $title, $message, [
                'type' => $category,
                'notification_id' => (string) $notification->id,
                'symbol' => $meta['symbol'] ?? 'DANGCEM',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $pushSent 
                ? 'Test notification sent to your phone!' 
                : 'Notification added to your inbox.',
            'push_sent' => $pushSent,
            'notification' => $notification,
        ]);
    }
}
