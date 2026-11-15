<?php

namespace App\Services;

use App\Models\ChatConversation;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotService
{
    protected string $geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    /**
     * Generate a grounded assistant reply for a user message.
     *
     * @param  array<string, mixed>  $contextBundle  Output from ChatbotContextService::build()
     * @return array{
     *   reply: string,
     *   cited_symbols: array<int, string>,
     *   suggested_followups: array<int, string>,
     *   needs_human_support: bool,
     *   provider: string
     * }
     */
    public function reply(ChatConversation $conversation, string $userMessage, array $contextBundle): array
    {
        $history = $this->loadRecentHistory($conversation);

        return $this->generateReply($userMessage, $history, $contextBundle, false);
    }

    /**
     * Generate a stateless public FAQ/stock reply for website visitors.
     *
     * @param  array<int, array{role: string, content: string}>  $history
     * @param  array<string, mixed>  $contextBundle
     */
    public function replyPublic(string $userMessage, array $history, array $contextBundle): array
    {
        return $this->generateReply($userMessage, $history, $contextBundle, true);
    }

    private function generateReply(string $userMessage, array $history, array $contextBundle, bool $isPublic): array
    {
        $systemInstruction = $this->buildSystemInstruction($contextBundle['prompt_context'] ?? '', $isPublic);

        $geminiResult = $this->askGemini($systemInstruction, $history, $userMessage);
        if ($geminiResult !== null) {
            return $this->sanitizeOutput($geminiResult, $contextBundle, 'gemini');
        }

        $perplexityResult = $this->askPerplexity($systemInstruction, $history, $userMessage);
        if ($perplexityResult !== null) {
            return $this->sanitizeOutput($perplexityResult, $contextBundle, 'perplexity');
        }

        return $this->buildOfflineFallback($userMessage, $contextBundle, $isPublic);
    }

    private function buildSystemInstruction(string $groundedContext, bool $isPublic = false): string
    {
        $supportRule = $isPublic
            ? '4. If the user asks about personal billing, account recovery, missing stocks, or direct human help, set `"needs_human_support": true` and invite them to sign in or email support@irshad.app.'
            : '4. If the user asks about billing disputes, double charges, missing stocks, broken features, account recovery, or explicitly asks to talk to a human/admin, set `"needs_human_support": true` and advise them they can tap **Send to Support Team** to route this chat to Irshad admins.';

        return <<<PROMPT
You are **Irshad Assistant**, the official in-app AI support & Islamic finance assistant for **Irshad** (an AAOIFI-aligned Halal stock screening, portfolio purification, and Zakat platform focused on the Nigerian Exchange / NGX).

RULES & GUARDRAILS:
1. Be warm, concise, structured (use clean markdown bullets where helpful), and accurate. Never mention "Qistal".
2. ONLY cite exact stock statuses, ratios, prices, or user holdings that appear in the CONTEXT provided below. If a stock is not in the context or has incomplete ratios, say so honestly instead of guessing numbers.
3. Never give personalized buy/sell investment advice or claim to issue a formal fatwa. Clarify that Irshad provides educational & AAOIFI-standard screening guidance.
{$supportRule}
5. Output ONLY a valid JSON object with these exact keys (no code fences):
{
  "reply": "<markdown answer to the user>",
  "cited_symbols": ["<UPPERCASE ticker symbols referenced from context, or empty array>"],
  "suggested_followups": ["<2 or 3 short natural next questions the user might tap>"],
  "needs_human_support": false
}

CONTEXT:
{$groundedContext}
PROMPT;
    }

    /**
     * Load the last 10 prior messages in chronological order (excluding the just-inserted latest turn if passed separately).
     *
     * @return array<int, array{role: string, content: string}>
     */
    private function loadRecentHistory(ChatConversation $conversation): array
    {
        $messages = $conversation->messages()
            ->orderByDesc('id')
            ->limit(11)
            ->get()
            ->reverse()
            ->values();

        // Remove the latest user message because callers pass $userMessage explicitly as the final turn
        if ($messages->isNotEmpty() && $messages->last()->role === 'user') {
            $messages->pop();
        }

        return $messages->take(10)->map(fn ($msg) => [
            'role' => $msg->role === 'assistant' ? 'assistant' : 'user',
            'content' => (string) $msg->content,
        ])->values()->all();
    }

    private function askGemini(string $systemInstruction, array $history, string $userMessage): ?array
    {
        $rawKeys = (string) config('services.gemini.key', '');
        $apiKeys = array_values(array_filter(array_map('trim', explode(',', $rawKeys))));
        if (empty($apiKeys)) {
            return null;
        }

        $contents = [];
        foreach ($history as $turn) {
            $contents[] = [
                'role' => $turn['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $turn['content']]],
            ];
        }
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $userMessage]],
        ];

        $startIndex = (int) Cache::get('gemini_key_index', 0);
        if (! isset($apiKeys[$startIndex])) {
            $startIndex = 0;
        }

        $keyCount = count($apiKeys);
        for ($attempt = 0; $attempt < $keyCount; $attempt++) {
            $idx = ($startIndex + $attempt) % $keyCount;
            $apiKey = $apiKeys[$idx];

            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->timeout(25)->post("{$this->geminiBaseUrl}/gemini-flash-latest:generateContent?key={$apiKey}", [
                    'systemInstruction' => [
                        'parts' => [['text' => $systemInstruction]],
                    ],
                    'contents' => $contents,
                    'generationConfig' => [
                        'temperature' => 0.3,
                        'responseMimeType' => 'application/json',
                    ],
                ]);

                if ($response->successful()) {
                    Cache::put('gemini_key_index', $idx);
                    $text = $response->json('candidates.0.content.parts.0.text', '');

                    return $this->parseModelPayload($text);
                }

                if ($response->status() === 429) {
                    Log::warning('ChatbotService Gemini key hit 429; rotating key.', ['index' => $idx]);
                    continue;
                }

                Log::error('ChatbotService Gemini API error', [
                    'status' => $response->status(),
                    'body' => substr($response->body(), 0, 500),
                ]);

                return null;
            } catch (\Throwable $e) {
                Log::error('ChatbotService Gemini exception: '.$e->getMessage());

                return null;
            }
        }

        return null;
    }

    private function askPerplexity(string $systemInstruction, array $history, string $userMessage): ?array
    {
        $apiKey = trim((string) env('PERPLEXITY_API_KEY', ''));
        if ($apiKey === '') {
            return null;
        }

        $messages = [
            ['role' => 'system', 'content' => $systemInstruction],
        ];
        foreach ($history as $turn) {
            $messages[] = [
                'role' => $turn['role'],
                'content' => $turn['content'],
            ];
        }
        $messages[] = ['role' => 'user', 'content' => $userMessage];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(25)->post('https://api.perplexity.ai/chat/completions', [
                'model' => env('PERPLEXITY_MODEL', 'sonar-pro'),
                'messages' => $messages,
                'temperature' => 0.2,
            ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content', '');

                return $this->parseModelPayload($content);
            }
        } catch (\Throwable $e) {
            Log::error('ChatbotService Perplexity exception: '.$e->getMessage());
        }

        return null;
    }

    private function parseModelPayload(string $raw): ?array
    {
        $clean = trim($raw);
        if ($clean === '') {
            return null;
        }

        if (str_starts_with($clean, '```json')) {
            $clean = substr($clean, 7);
        } elseif (str_starts_with($clean, '```')) {
            $clean = substr($clean, 3);
        }
        if (str_ends_with($clean, '```')) {
            $clean = substr($clean, 0, -3);
        }
        $clean = trim($clean);

        $decoded = json_decode($clean, true);
        if (is_array($decoded) && ! empty($decoded['reply'])) {
            return $decoded;
        }

        // Plain-text fallback if model returned readable markdown instead of strict JSON
        return [
            'reply' => $clean,
            'cited_symbols' => [],
            'suggested_followups' => [],
            'needs_human_support' => false,
        ];
    }

    private function sanitizeOutput(array $parsed, array $contextBundle, string $provider): array
    {
        $knownSymbols = array_column($contextBundle['matched_companies'] ?? [], 'symbol');

        $cited = array_values(array_unique(array_filter(
            array_map(fn ($s) => strtoupper(trim((string) $s)), (array) ($parsed['cited_symbols'] ?? [])),
            fn ($s) => in_array($s, $knownSymbols, true)
        )));

        if (empty($cited) && ! empty($knownSymbols)) {
            $cited = $knownSymbols;
        }

        $followups = array_values(array_slice(array_filter(
            array_map(fn ($q) => trim((string) $q), (array) ($parsed['suggested_followups'] ?? [])),
            fn ($q) => $q !== ''
        ), 0, 3));

        return [
            'reply' => trim((string) ($parsed['reply'] ?? '')),
            'cited_symbols' => $cited,
            'suggested_followups' => $followups,
            'needs_human_support' => (bool) ($parsed['needs_human_support'] ?? false),
            'provider' => $provider,
        ];
    }

    private function buildOfflineFallback(string $userMessage, array $contextBundle, bool $isPublic = false): array
    {
        $companies = $contextBundle['matched_companies'] ?? [];
        $lower = strtolower($userMessage);
        $wantsHuman = str_contains($lower, 'support')
            || str_contains($lower, 'human')
            || str_contains($lower, 'admin')
            || str_contains($lower, 'bug')
            || str_contains($lower, 'billing')
            || str_contains($lower, 'refund');

        $lines = [];
        if (! empty($companies)) {
            $lines[] = 'Here is what I found in the Irshad database right now:';
            foreach ($companies as $company) {
                $lines[] = "- **{$company['name']} ({$company['symbol']})**: Status is **".strtoupper((string) $company['status']).'**. Open its AAOIFI Screening page to inspect the full ratio breakdown.';
            }
        } else {
            $lines[] = "I'm currently operating in offline knowledge mode, so I may not be able to answer detailed custom questions right now.";
            $lines[] = '- For stock screening rules, Irshad applies **AAOIFI Standard No. 21** (<30% debt, <30% cash/interest deposits, <5% impermissible income).';
            $lines[] = '- For Zakat & Hawl date questions, check **Portfolio → Zakat** or **Profile**.';
        }

        $lines[] = $isPublic
            ? "\nIf you need direct help from our team, sign in or email **support@irshad.app**."
            : "\nIf you need direct help from our team, tap **Send to Support Team** below.";

        return [
            'reply' => implode("\n", $lines),
            'cited_symbols' => array_column($companies, 'symbol'),
            'suggested_followups' => [
                'How does AAOIFI screening work?',
                'How do I calculate Zakat & Hawl?',
            ],
            'needs_human_support' => $wantsHuman || empty($companies),
            'provider' => 'fallback',
        ];
    }
}
