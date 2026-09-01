<?php

namespace App\Http\Controllers;

use App\Models\Suggestion;
use App\Models\User;
use App\Models\UserNotification;
use App\Notifications\AdminSuggestionNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SuggestionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000'
        ]);

        $suggestion = Suggestion::create([
            'user_id' => auth()->id(),
            'message' => $request->message,
            'status' => 'unread'
        ]);

        // Notify all admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            // 1. In-app notification
            UserNotification::notify(
                $admin->id,
                'New Suggestion',
                'New suggestion received from ' . (auth()->user()->name ?? 'a user') . '.',
                [
                    'category' => 'system',
                    'icon' => '💡',
                    'action_url' => '/admin/inbox'
                ]
            );

            // 2. Email notification
            $admin->notify(new AdminSuggestionNotification($suggestion));
        }

        return response()->json([
            'message' => 'Suggestion submitted successfully.',
            'suggestion' => $suggestion
        ]);
    }

    // Admin methods
    public function unreadCount(): JsonResponse
    {
        $count = Suggestion::where('status', 'unread')->count();
        return response()->json(['count' => $count]);
    }

    public function index(): JsonResponse
    {
        $suggestions = Suggestion::with('user:id,name,email')->orderBy('created_at', 'desc')->paginate(20);
        
        return response()->json([
            'data' => $suggestions->items(),
            'pagination' => [
                'current_page' => $suggestions->currentPage(),
                'last_page' => $suggestions->lastPage(),
                'total' => $suggestions->total(),
            ]
        ]);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $suggestion = Suggestion::findOrFail($id);
        $request->validate(['status' => 'required|in:unread,read,archived']);
        $suggestion->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Status updated.',
            'suggestion' => $suggestion
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $suggestion = Suggestion::findOrFail($id);
        $suggestion->delete();

        return response()->json(['message' => 'Suggestion deleted.']);
    }
}
