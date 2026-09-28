<?php

namespace App\Http\Controllers;

use App\Models\Suggestion;
use App\Models\User;
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
            // 1. Email notification
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
        $count = Suggestion::where('status', 'unread')->where('is_admin_reply', false)->count();
        return response()->json(['count' => $count]);
    }

    public function index(): JsonResponse
    {
        // Fetch all suggestions, sorted by oldest first so that they appear sequentially in chat
        $allSuggestions = Suggestion::with('user:id,name,email')
            ->orderBy('created_at', 'asc')
            ->get();
            
        // Group them by user_id
        $grouped = $allSuggestions->groupBy('user_id');
        
        // Format into a list of conversations
        $conversations = [];
        
        foreach ($grouped as $userId => $userSuggestions) {
            $user = $userSuggestions->first()->user;
            
            // Only include conversations where the user exists
            if (!$user) continue;

            $hasUnread = $userSuggestions->where('status', 'unread')->where('is_admin_reply', false)->count() > 0;
            $lastInteraction = $userSuggestions->last()->created_at;

            $conversations[] = [
                'user' => $user,
                'has_unread' => $hasUnread,
                'last_interaction' => $lastInteraction,
                'messages' => $userSuggestions->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'message' => $s->message,
                        'status' => $s->status,
                        'is_admin_reply' => (bool)$s->is_admin_reply,
                        'created_at' => $s->created_at
                    ];
                })->values()
            ];
        }

        // Sort conversations by last interaction (newest first)
        usort($conversations, function ($a, $b) {
            return $b['last_interaction'] <=> $a['last_interaction'];
        });
        
        return response()->json([
            'data' => $conversations
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

    public function reply(Request $request, $id): JsonResponse
    {
        $request->validate([
            'reply' => 'required|string|max:2000'
        ]);

        $suggestion = Suggestion::with('user')->findOrFail($id);
        
        if (!$suggestion->user || !$suggestion->user->email) {
            return response()->json(['message' => 'User does not have an email address.'], 400);
        }

        $user = $suggestion->user;
        $replyMessage = $request->reply;

        \Illuminate\Support\Facades\Mail::raw(
            "Hello {$user->name},\n\nThank you for your suggestion:\n\"{$suggestion->message}\"\n\nResponse from Irshad Admin:\n{$replyMessage}\n\nThanks,\nThe Irshad Team",
            function ($message) use ($user) {
                $message->to($user->email)->subject('Re: Your Suggestion for Irshad');
            }
        );

        // Store the admin reply as a chat message
        Suggestion::create([
            'user_id' => $user->id,
            'message' => $replyMessage,
            'is_admin_reply' => true,
            'status' => 'read'
        ]);

        $suggestion->update(['status' => 'read']);

        return response()->json(['message' => 'Reply sent successfully.']);
    }
}
