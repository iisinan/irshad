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
use Illuminate\Support\Facades\Log;
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

        $contextBundle = $contextService->buildPublic($cleanMessage);
        $aiResult = $chatbotService->replyPublic($cleanMessage, $history, $contextBundle);

        return response()->json([
            'assistant_message' => [
                'id' => null,
                'role' => 'assistant',
                'content' => $aiResult['reply'],
                'metadata' => [
                    'cited_symbols' => $aiResult['cited_symbols'],
                    'matched_companies' => $contextBundle['matched_companies'],
                    'matched_resources' => $contextBundle['matched_resources'],
                    'suggested_followups' => $aiResult['suggested_followups'],
                    'needs_human_support' => $aiResult['needs_human_support'],
                    'provider' => $aiResult['provider'],
                ],
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

        $contextBundle = $contextService->build($user, $cleanMessage);
        $aiResult = $chatbotService->reply($conversation, $cleanMessage, $contextBundle);

        $metadata = [
            'cited_symbols' => $aiResult['cited_symbols'],
            'matched_companies' => $contextBundle['matched_companies'],
            'matched_resources' => $contextBundle['matched_resources'],
            'suggested_followups' => $aiResult['suggested_followups'],
            'needs_human_support' => $aiResult['needs_human_support'],
            'provider' => $aiResult['provider'],
        ];

        $assistantMessage = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $aiResult['reply'],
            'metadata' => $metadata,
        ]);

        $conversation->update([
            'last_message_at' => now(),
        ]);

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'status' => $conversation->status,
                'last_message_at' => $conversation->last_message_at,
            ],
            'user_message' => $userMessage,
            'assistant_message' => $assistantMessage,
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

        if ($conversation->status === 'escalated') {
            return response()->json([
                'message' => 'This conversation has already been sent to Irshad Support.',
                'status' => 'escalated',
            ]);
        }

        $recentTranscript = $conversation->messages
            ->slice(-6)
            ->map(fn (ChatMessage $m) => ($m->role === 'user' ? 'User' : 'Irshad AI').': '.Str::limit(trim($m->content), 350))
            ->implode("\n");

        $note = trim((string) ($validated['note'] ?? ''));
        $compiledMessage = "[AI Chat Escalation: {$conversation->title}]\n";
        if ($note !== '') {
            $compiledMessage .= "User Note: {$note}\n";
        }
        $compiledMessage .= "\nRecent Chat Transcript:\n{$recentTranscript}";

        $suggestion = Suggestion::create([
            'user_id' => $user->id,
            'chat_conversation_id' => $conversation->id,
            'message' => Str::limit($compiledMessage, 1950),
            'status' => 'unread',
        ]);

        $conversation->update(['status' => 'escalated']);

        try {
            $admins = User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                $admin->notify(new AdminSuggestionNotification($suggestion));
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to queue admin escalation email: '.$e->getMessage());
        }

        return response()->json([
            'message' => 'Sent to the Irshad Support Team. We will follow up by email.',
            'status' => 'escalated',
            'suggestion_id' => $suggestion->id,
        ]);
    }
}
