<?php

namespace App\Http\Controllers;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\Suggestion;
use App\Models\User;
use App\Notifications\AdminSuggestionNotification;
use App\Services\ChatbotContextService;
use App\Services\ChatbotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function publicMessage(
        Request $request,
        ChatbotContextService $contextService,
        ChatbotService $chatbotService
    ): JsonResponse {
        $validated = $request->validate([
            'message' => 'required|string|min:2|max:500',
            'history' => 'nullable|array|max:6',
            'history.*.role' => 'required_with:history|in:user,assistant',
            'history.*.content' => 'required_with:history|string|max:600',
        ]);

        $cleanMessage = trim($validated['message']);
        $history = collect($validated['history'] ?? [])
            ->map(fn (array $turn) => [
                'role' => $turn['role'],
                'content' => trim((string) $turn['content']),
            ])
            ->values()
            ->all();

        $quickResult = $chatbotService->quickPrecheck($cleanMessage, true);
        if ($quickResult !== null) {
            return response()->json([
                'assistant_message' => [
                    'id' => null,
                    'role' => 'assistant',
                    'content' => $quickResult['reply'],
                    'metadata' => $this->buildMetadata($quickResult, [
                        'matched_companies' => [],
                        'matched_resources' => [],
                        'tier' => ['slug' => 'guest', 'name' => 'Guest'],
                    ]),
                    'created_at' => now()->toISOString(),
                ],
            ]);
        }

        $contextBundle = $contextService->buildPublic($cleanMessage);
        $aiResult = $chatbotService->replyPublic($cleanMessage, $history, $contextBundle);

        return response()->json([
            'assistant_message' => [
                'id' => null,
                'role' => 'assistant',
                'content' => $aiResult['reply'],
                'metadata' => $this->buildMetadata($aiResult, $contextBundle),
                'created_at' => now()->toISOString(),
            ],
        ]);
    }

    public function conversations(Request $request): JsonResponse
    {
        $conversations = ChatConversation::where('user_id', $request->user()->id)
            ->with(['latestMessage'])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->limit(25)
            ->get()
            ->map(fn (ChatConversation $conv) => [
                'id' => $conv->id,
                'title' => $conv->title,
                'status' => $conv->status,
                'last_message_at' => $conv->last_message_at,
                'created_at' => $conv->created_at,
                'preview' => $conv->latestMessage ? Str::limit((string) $conv->latestMessage->content, 90) : '',
            ]);

        return response()->json(['data' => $conversations]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $conversation = ChatConversation::where('user_id', $request->user()->id)
            ->with('messages')
            ->findOrFail($id);

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'status' => $conversation->status,
                'last_message_at' => $conversation->last_message_at,
            ],
            'messages' => $conversation->messages,
        ]);
    }

    public function sendMessage(
        Request $request,
        ChatbotContextService $contextService,
        ChatbotService $chatbotService
    ): JsonResponse {
        $validated = $request->validate([
            'message' => 'required|string|min:2|max:1000',
            'conversation_id' => 'nullable|integer',
        ]);

        $user = $request->user();
        $cleanMessage = trim($validated['message']);

        if (! empty($validated['conversation_id'])) {
            $conversation = ChatConversation::where('user_id', $user->id)
                ->findOrFail((int) $validated['conversation_id']);
        } else {
            $conversation = ChatConversation::create([
                'user_id' => $user->id,
                'title' => Str::limit($cleanMessage, 70),
                'status' => 'active',
                'last_message_at' => now(),
            ]);
        }

        $userMessage = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $cleanMessage,
        ]);

        // When a human admin has already joined the thread, keep the live human chat uninterrupted.
        if ($conversation->status === 'admin_joined') {
            $conversation->update(['last_message_at' => now()]);
            $conversation->loadMissing('messages');
            $this->ensureEscalationTicket($conversation, $user, '', false);

            return response()->json([
                'conversation' => [
                    'id' => $conversation->id,
                    'title' => $conversation->title,
                    'status' => $conversation->status,
                    'last_message_at' => $conversation->last_message_at,
                ],
                'user_message' => $userMessage,
                'assistant_message' => null,
                'waiting_for_admin' => true,
            ], 201);
        }

        if ($conversation->status === 'closed') {
            $conversation->update(['status' => 'active']);
        }

        $quickResult = $chatbotService->quickPrecheck($cleanMessage, false);
        if ($quickResult !== null) {
            $contextBundle = [
                'matched_companies' => [],
                'matched_resources' => [],
            ];
            $aiResult = $quickResult;
        } else {
            $contextBundle = $contextService->build($user, $cleanMessage);
            $aiResult = $chatbotService->reply($conversation, $cleanMessage, $contextBundle, $user);
        }

        $metadata = $this->buildMetadata($aiResult, $contextBundle);

        $assistantMessage = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $aiResult['reply'],
            'metadata' => $metadata,
        ]);

        $needsHumanSupport = (bool) ($aiResult['needs_human_support'] ?? false);
        $updateFields = ['last_message_at' => now()];

        if ($needsHumanSupport && $conversation->status !== 'escalated') {
            $updateFields['status'] = 'escalated';
        }

        $conversation->update($updateFields);

        if ($needsHumanSupport || $conversation->status === 'escalated') {
            $conversation->loadMissing('messages');
            $this->ensureEscalationTicket($conversation, $user, '', $needsHumanSupport);
        }

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'status' => $conversation->status,
                'last_message_at' => $conversation->last_message_at,
            ],
            'user_message' => $userMessage,
            'assistant_message' => $assistantMessage,
            'waiting_for_admin' => $conversation->status === 'escalated',
        ], 201);
    }

    public function feedback(Request $request, int $messageId): JsonResponse
    {
        $validated = $request->validate([
            'feedback' => 'required|in:up,down',
        ]);

        $message = ChatMessage::whereHas('conversation', function ($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->where('role', 'assistant')->findOrFail($messageId);

        $message->update(['feedback' => $validated['feedback']]);

        return response()->json([
            'message' => 'Feedback recorded.',
            'chat_message' => $message,
        ]);
    }

    public function escalate(Request $request, int $conversationId): JsonResponse
    {
        $validated = $request->validate([
            'note' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $conversation = ChatConversation::where('user_id', $user->id)
            ->with('messages')
            ->findOrFail($conversationId);

        $note = trim((string) ($validated['note'] ?? ''));

        if ($conversation->status === 'escalated' && $note === '') {
            return response()->json([
                'message' => 'This conversation has already been sent to Irshad Support.',
                'status' => 'escalated',
            ]);
        }

        $suggestion = $this->ensureEscalationTicket($conversation, $user, $note, true);

        if (! in_array($conversation->status, ['escalated', 'admin_joined'], true)) {
            $conversation->update(['status' => 'escalated']);
        }

        return response()->json([
            'message' => 'Sent to the Irshad Support Team. An admin can reply directly in this chat.',
            'status' => $conversation->status,
            'suggestion_id' => $suggestion->id,
        ]);
    }

    public function resumeAi(Request $request, int $conversationId): JsonResponse
    {
        $conversation = ChatConversation::where('user_id', $request->user()->id)
            ->findOrFail($conversationId);

        if ($conversation->status !== 'active') {
            $conversation->update([
                'status' => 'active',
                'last_message_at' => now(),
            ]);

            ChatMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'system',
                'content' => 'Returned conversation to Ask Irshad AI.',
            ]);
        }

        $conversation->load('messages');

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'status' => $conversation->status,
                'last_message_at' => $conversation->last_message_at,
            ],
            'messages' => $conversation->messages,
        ]);
    }

    // ─── Admin Live Chat Methods ────────────────────────────────────────────

    public function adminConversations(Request $request): JsonResponse
    {
        $filter = (string) $request->query('filter', 'all');

        $query = ChatConversation::with(['user:id,name,email', 'latestMessage'])
            ->withCount('messages');

        if ($filter === 'attention') {
            $query->whereIn('status', ['escalated', 'admin_joined']);
        } elseif ($filter === 'closed') {
            $query->where('status', 'closed');
        }

        $items = $query
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->limit(60)
            ->get()
            ->map(function (ChatConversation $conv) {
                $latest = $conv->latestMessage;
                $needsAttention = $conv->status === 'escalated'
                    || ($conv->status === 'admin_joined' && $latest?->role === 'user');

                $lastAdminId = (int) (ChatMessage::where('conversation_id', $conv->id)
                    ->where('role', 'admin')
                    ->max('id') ?? 0);

                $unreadUserMessages = $needsAttention
                    ? ChatMessage::where('conversation_id', $conv->id)
                        ->where('role', 'user')
                        ->where('id', '>', $lastAdminId)
                        ->count()
                    : 0;

                return [
                    'id' => $conv->id,
                    'title' => $conv->title,
                    'status' => $conv->status,
                    'needs_attention' => $needsAttention,
                    'unread_count' => $unreadUserMessages,
                    'messages_count' => $conv->messages_count,
                    'last_message_at' => $conv->last_message_at,
                    'created_at' => $conv->created_at,
                    'preview' => $latest ? Str::limit((string) $latest->content, 110) : '',
                    'latest_role' => $latest?->role,
                    'user' => $conv->user ? [
                        'id' => $conv->user->id,
                        'name' => $conv->user->name ?? 'User',
                        'email' => $conv->user->email,
                    ] : null,
                ];
            })
            ->sortByDesc(fn (array $item) => [
                $item['status'] === 'escalated' ? 3 : ($item['needs_attention'] ? 2 : ($item['status'] === 'admin_joined' ? 1 : 0)),
                $item['last_message_at']?->timestamp ?? 0,
                $item['id'],
            ])
            ->values();

        return response()->json(['data' => $items]);
    }

    public function adminShow(int $id): JsonResponse
    {
        $conversation = ChatConversation::with(['user:id,name,email', 'messages'])
            ->findOrFail($id);

        Suggestion::where('chat_conversation_id', $conversation->id)
            ->where('status', 'unread')
            ->where('is_admin_reply', false)
            ->update(['status' => 'read']);

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'status' => $conversation->status,
                'last_message_at' => $conversation->last_message_at,
                'user' => $conversation->user ? [
                    'id' => $conversation->user->id,
                    'name' => $conversation->user->name ?? 'User',
                    'email' => $conversation->user->email,
                ] : null,
            ],
            'messages' => $conversation->messages,
        ]);
    }

    public function adminReply(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reply' => 'required|string|min:1|max:2000',
            'notify_email' => 'nullable|boolean',
        ]);

        $conversation = ChatConversation::with('user')->findOrFail($id);
        $admin = $request->user();
        $cleanReply = trim($validated['reply']);
        $adminName = $admin?->name ?? $admin?->first_name ?? 'Irshad Admin';

        if ($conversation->status !== 'admin_joined') {
            ChatMessage::create([
                'conversation_id' => $conversation->id,
                'role' => 'system',
                'content' => "{$adminName} joined the conversation.",
            ]);
        }

        $adminMessage = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'admin',
            'content' => $cleanReply,
            'metadata' => [
                'admin_id' => $admin?->id,
                'admin_name' => $adminName,
            ],
        ]);

        $conversation->update([
            'status' => 'admin_joined',
            'last_message_at' => now(),
        ]);

        Suggestion::where('chat_conversation_id', $conversation->id)
            ->where('status', 'unread')
            ->update(['status' => 'read']);

        if ($conversation->user) {
            Suggestion::create([
                'user_id' => $conversation->user->id,
                'chat_conversation_id' => $conversation->id,
                'message' => $cleanReply,
                'is_admin_reply' => true,
                'status' => 'read',
            ]);
        }

        $emailed = false;
        $shouldEmail = $request->boolean('notify_email', true)
            && $conversation->user?->email
            && Cache::add("chat_admin_reply_email:{$conversation->id}", 1, now()->addMinutes(10));

        if ($shouldEmail) {
            try {
                $user = $conversation->user;
                $chatUrl = rtrim((string) config('app.frontend_url'), '/').'/portfolio';
                Mail::raw(
                    "As-salamu alaykum {$user->name},\n\nAn Irshad Admin replied to your chat (\"{$conversation->title}\"):\n\n\"{$cleanReply}\"\n\nOpen Ask Irshad in the app or web ({$chatUrl}) to continue the live conversation.\n\nJazakallah Khair,\nThe Irshad Team",
                    function ($message) use ($user) {
                        $message->to($user->email)->subject('Irshad Support Replied to Your Chat');
                    }
                );
                $emailed = true;
            } catch (\Throwable $e) {
                Log::warning('Failed to email user after admin chat reply: '.$e->getMessage());
            }
        }

        $conversation->load('messages');

        return response()->json([
            'message' => $emailed ? 'Reply sent to live chat and user notified by email.' : 'Reply sent to live chat.',
            'emailed' => $emailed,
            'conversation' => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'status' => $conversation->status,
                'last_message_at' => $conversation->last_message_at,
            ],
            'admin_message' => $adminMessage,
            'messages' => $conversation->messages,
        ], 201);
    }

    public function adminUpdateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:active,escalated,admin_joined,closed',
        ]);

        $conversation = ChatConversation::findOrFail($id);
        $nextStatus = $validated['status'];

        if ($conversation->status !== $nextStatus) {
            $conversation->update([
                'status' => $nextStatus,
                'last_message_at' => now(),
            ]);

            if ($nextStatus === 'active') {
                ChatMessage::create([
                    'conversation_id' => $conversation->id,
                    'role' => 'system',
                    'content' => 'Support handoff completed — Ask Irshad AI is ready to assist again.',
                ]);
            } elseif ($nextStatus === 'closed') {
                ChatMessage::create([
                    'conversation_id' => $conversation->id,
                    'role' => 'system',
                    'content' => 'Support conversation marked resolved by admin.',
                ]);
            }
        }

        if (in_array($nextStatus, ['active', 'closed'], true)) {
            Suggestion::where('chat_conversation_id', $conversation->id)
                ->where('status', 'unread')
                ->update(['status' => 'read']);
        }

        $conversation->load('messages');

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'status' => $conversation->status,
                'last_message_at' => $conversation->last_message_at,
            ],
            'messages' => $conversation->messages,
        ]);
    }

    private function ensureEscalationTicket(
        ChatConversation $conversation,
        User $user,
        string $note = '',
        bool $notifyAdmins = true
    ): Suggestion {
        $recentTranscript = $conversation->messages
            ->slice(-6)
            ->map(function (ChatMessage $m) {
                $speaker = match ($m->role) {
                    'user' => 'User',
                    'admin' => 'Irshad Admin',
                    'system' => 'System',
                    default => 'Irshad AI',
                };

                return "{$speaker}: ".Str::limit(trim($m->content), 350);
            })
            ->implode("\n");

        $compiledMessage = "[AI Chat Escalation: {$conversation->title}]\n";
        if ($note !== '') {
            $compiledMessage .= "User Note: {$note}\n";
        }
        $compiledMessage .= "\nRecent Chat Transcript:\n{$recentTranscript}";
        $finalMessage = Str::limit($compiledMessage, 1950);

        $existing = Suggestion::where('chat_conversation_id', $conversation->id)
            ->where('is_admin_reply', false)
            ->latest('id')
            ->first();

        $wasRecentlyNotified = $existing !== null && ! $notifyAdmins;

        if ($existing) {
            $existing->update([
                'message' => $finalMessage,
                'status' => 'unread',
            ]);
            $suggestion = $existing;
        } else {
            $suggestion = Suggestion::create([
                'user_id' => $user->id,
                'chat_conversation_id' => $conversation->id,
                'message' => $finalMessage,
                'status' => 'unread',
            ]);
        }

        if ($notifyAdmins && ! $wasRecentlyNotified && Cache::add("chat_admin_email_alert:{$conversation->id}", 1, now()->addMinutes(10))) {
            try {
                $admins = User::where('role', 'admin')->get();
                foreach ($admins as $admin) {
                    $admin->notify(new AdminSuggestionNotification($suggestion));
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to queue admin escalation email: '.$e->getMessage());
            }
        }

        return $suggestion;
    }

    /**
     * Build normalized metadata attached to assistant chat responses.
     *
     * @return array<string, mixed>
     */
    private function buildMetadata(array $aiResult, array $contextBundle): array
    {
        $tier = $contextBundle['tier'] ?? null;

        return [
            'cited_symbols' => $aiResult['cited_symbols'] ?? [],
            'matched_companies' => $contextBundle['matched_companies'] ?? [],
            'matched_resources' => $contextBundle['matched_resources'] ?? [],
            'suggested_followups' => $aiResult['suggested_followups'] ?? [],
            'needs_human_support' => (bool) ($aiResult['needs_human_support'] ?? false),
            'upgrade_required' => (bool) ($aiResult['upgrade_required'] ?? false),
            'required_tier' => $aiResult['required_tier'] ?? null,
            'upgrade_feature' => $aiResult['upgrade_feature'] ?? null,
            'tier_slug' => $tier['slug'] ?? null,
            'tier_name' => $tier['name'] ?? null,
            'provider' => $aiResult['provider'] ?? 'unknown',
        ];
    }
}
