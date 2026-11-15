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

    /**
     * Fast pre-DB check for stock-compliance policy blocks, greetings, and exact FAQ starters (<1ms).
     */
    public function quickPrecheck(string $userMessage, bool $isPublic = false): ?array
    {
        if ($this->isStockComplianceQuestion($userMessage, false)) {
            return $this->complianceDeclinePayload();
        }

        return $this->matchInstantReply($userMessage, [], $isPublic);
    }

    private function complianceDeclinePayload(): array
    {
        return [
            'reply' => "I cannot answer stock compliance questions or state whether a specific company (such as MTN/MTNN or others) is Halal, Questionable, or Non-Compliant.\n\nTo view AAOIFI screening statuses and financial ratios for any listed stock, please use the **Market Screener** directly inside Irshad. You can still ask me how AAOIFI Standard No. 21 works in general, or about Zakat, Hawl, dividend purification, and your account.",
            'cited_symbols' => [],
            'suggested_followups' => [
                'How does AAOIFI screening work?',
                'How do Zakat & Hawl work?',
            ],
            'needs_human_support' => false,
            'provider' => 'policy',
        ];
    }

    private function generateReply(string $userMessage, array $history, array $contextBundle, bool $isPublic): array
    {
        if ($this->isStockComplianceQuestion($userMessage, (bool) ($contextBundle['has_company_mention'] ?? false))) {
            return $this->complianceDeclinePayload();
        }

        $instant = $this->matchInstantReply($userMessage, $contextBundle, $isPublic);
        if ($instant !== null) {
            return $instant;
        }

        $canCacheFaq = empty($history)
            && ! app()->runningUnitTests()
            && ! preg_match('/\b(my\s+(?:portfolio|holding|holdings|hawl|zakat|account|plan|subscription|dividend|dividends)|i\s+(?:have|own|hold|bought|sold|paid|was\s+charged)|account|subscription|billing|refund|charge|charged|password|login|verify)\b/i', $userMessage);

        $cacheKey = 'chatbot_faq_v2:'.sha1(($isPublic ? 'pub:' : 'auth:').$this->normalizeQuestion($userMessage));
        if ($canCacheFaq && ($cached = Cache::get($cacheKey)) && is_array($cached)) {
            return $cached;
        }

        $systemInstruction = $this->buildSystemInstruction($contextBundle['prompt_context'] ?? '', $isPublic);

        $geminiResult = $this->askGemini($systemInstruction, $history, $userMessage);
        if ($geminiResult !== null) {
            $output = $this->sanitizeOutput($geminiResult, 'gemini');
            if ($canCacheFaq && ! empty($output['reply'])) {
                Cache::put($cacheKey, $output, 1800);
            }

            return $output;
        }

        $perplexityResult = $this->askPerplexity($systemInstruction, $history, $userMessage);
        if ($perplexityResult !== null) {
            $output = $this->sanitizeOutput($perplexityResult, 'perplexity');
            if ($canCacheFaq && ! empty($output['reply'])) {
                Cache::put($cacheKey, $output, 1800);
            }

            return $output;
        }

        return $this->buildOfflineFallback($userMessage, $isPublic);
    }

    private function buildSystemInstruction(string $groundedContext, bool $isPublic = false): string
    {
        $supportRule = $isPublic
            ? '4. If the user asks about personal billing, account recovery, missing stocks, or direct human help, set `"needs_human_support": true` and invite them to sign in or email support@irshad.app.'
            : '4. If the user asks about billing disputes, double charges, missing stocks, broken features, account recovery, or explicitly asks to talk to a human/admin, set `"needs_human_support": true` and advise them they can tap **Send to Support Team** to route this chat to Irshad admins.';

        return <<<PROMPT
You are **Irshad Assistant**, the fast in-app AI support & Islamic finance assistant for **Irshad** (an AAOIFI-aligned Halal stock screening, portfolio purification, and Zakat platform).

RULES & GUARDRAILS:
1. Keep replies crisp, structured, and concise (under 110 words using short markdown bullets unless detailed steps are requested). Never mention "Qistal".
2. STRICT COMPLIANCE POLICY: NEVER tell the user whether any specific company, ticker, or stock (e.g. MTN, MTNN, Dangote, GTCO, Zenith, etc.) is Halal, Haram, Permissible, Questionable, or Compliant/Non-Compliant, NEVER share company-specific debt/cash/impermissible ratios, and NEVER list/recommend Halal stocks. Always decline stock compliance queries politely and direct the user to check inside the Irshad **Market Screener**.
3. Never give personalized buy/sell investment advice or issue formal fatwas. Keep guidance educational and aligned with the CONTEXT below.
{$supportRule}
5. Output ONLY a valid JSON object with these exact keys (no code fences):
{
  "reply": "<concise markdown answer>",
  "suggested_followups": ["<2 short natural next questions>"],
  "needs_human_support": false
}

CONTEXT:
{$groundedContext}
PROMPT;
    }

    private function normalizeQuestion(string $text): string
    {
        $clean = strtolower(trim($text));
        $clean = preg_replace('/[^\w\s&]/u', ' ', $clean) ?? $clean;

        return trim(preg_replace('/\s+/', ' ', $clean) ?? $clean);
    }

    private function isStockComplianceQuestion(string $message, bool $hasCompanyMention): bool
    {
        $lower = $this->normalizeQuestion($message);

        // Allow pure general AAOIFI / purification methodology questions with no company mention
        if (! $hasCompanyMention && preg_match('/^(how (does|do|are)|what (is|are)|explain)\s+(the\s+)?(aaoifi|shariah screening|stock screening|halal screening|screening methodology|dividend purification|purification|zakat|hawl)/i', $lower)) {
            return false;
        }

        // Block requests asking for lists/recommendations of halal or compliant stocks
        if (preg_match('/\b(which|what|list|show|give|find|recommend|suggest|best|top|any)\b.*\b(stock|stocks|company|companies|share|shares|equity|equities|ticker|tickers)\b.*\b(halal|haram|compliant|non[\s-]*compliant|shariah|sharia|permissible|questionable)\b/i', $lower)
            || preg_match('/\b(halal|shariah[\s-]*compliant|compliant)\s+(stock|stocks|company|companies|share|shares|pick|picks|list)\b/i', $lower)) {
            return true;
        }

        // Block "is <company/asset> halal / haram / compliant / permissible / questionable?"
        if (preg_match('/\b(?:is|are|check|verify|whether|tell me if)\s+([a-z0-9&.\-\s]{2,35}?)\s+(?:is\s+)?(?:halal|haram|permissible|impermissible|shariah[\s-]*compliant|sharia[\s-]*compliant|compliant|non[\s-]*compliant|questionable|allowed)\b/i', $lower, $m)) {
            $subject = trim($m[1]);
            $nonCompanySubjects = [
                'aaoifi', 'aaoifi screening', 'investing', 'stock investing', 'it', 'that', 'this',
                'the platform', 'irshad', 'dividend', 'dividends', 'zakat', 'capital gains', 'purification',
                'what makes a stock', 'why a stock', 'when a stock', 'how a stock',
            ];
            if (! in_array($subject, $nonCompanySubjects, true)) {
                return true;
            }
        }

        // Block direct "<TICKER/NAME> halal / compliance / status / debt ratio" queries
        if (preg_match('/\b([a-z0-9]{2,14})\s+(?:halal|haram|shariah|sharia|compliant|compliance|aaoifi\s+status|compliance\s+status|screening\s+status|debt\s+ratio|cash\s+ratio)\b/i', $lower, $m)) {
            $token = $m[1];
            $excludedPrevWords = [
                'not', 'are', 'is', 'was', 'does', 'do', 'make', 'makes', 'mean', 'means',
                'become', 'becomes', 'stay', 'stays', 'considered', 'marked', 'still', 'into',
                'stocks', 'stock', 'investing', 'aaoifi', 'shariah', 'sharia', 'halal', 'haram',
                'non', 'what', 'why', 'how', 'for', 'about', 'with', 'this', 'that', 'from',
                'dividend', 'dividends', 'portfolio', 'your', 'my', 'their', 'the', 'and', 'be',
            ];
            if (! in_array($token, $excludedPrevWords, true)) {
                return true;
            }
        }

        // If message mentions an actual company/ticker alongside any compliance/investment-verdict word
        if ($hasCompanyMention && preg_match('/\b(halal|haram|compliant|compliance|shariah|sharia|permissible|impermissible|questionable|status|ratio|debt|cash|screen|screening|purify|buy|invest)\b/i', $lower)) {
            return true;
        }

        return false;
    }

    private function matchInstantReply(string $userMessage, array $contextBundle, bool $isPublic): ?array
    {
        $norm = $this->normalizeQuestion($userMessage);

        if (in_array($norm, ['hi', 'hello', 'hey', 'salam', 'salams', 'assalamu alaikum', 'as salamu alaykum'], true)) {
            return [
                'reply' => "As-salamu alaykum! How can I help you today? You can ask me about **AAOIFI screening rules**, **Zakat & Hawl**, **dividend purification**, or **Irshad account & billing**.",
                'cited_symbols' => [],
                'suggested_followups' => [
                    'How does AAOIFI screening work?',
                    'How do Zakat & Hawl work?',
                ],
                'needs_human_support' => false,
                'provider' => 'instant',
            ];
        }

        $kb = config('irshad_kb', []);
        $starters = [
            'how does aaoifi screening work' => [
                'reply' => "Irshad applies **AAOIFI Shariah Standard No. 21** across two stages:\n- **Business Activity Screen:** Excludes companies with core revenue from prohibited sectors (conventional interest banking/insurance, alcohol, gambling, tobacco, pork, adult entertainment, prohibited weapons).\n- **Financial Ratio Screen:** Requires conventional debt < **30%** of market cap, interest-bearing cash/deposits < **30%** of market cap, and impermissible income < **5%** of total revenue.\n\nTo look up an individual company's breakdown, use the **Market Screener** inside Irshad.",
                'followups' => ['How does dividend purification work?', 'How do Zakat & Hawl work?'],
                'support' => false,
            ],
            'how do zakat hawl work' => [
                'reply' => "Irshad calculates your **2.5% annual Zakat** once wealth remains above **Nisab** for one full lunar year (**Hawl**):\n- Set your Hawl date once under **Profile** or **Portfolio → Zakat** and it applies across your portfolio.\n- Live **gold & silver Nisab** benchmarks and Zakat breakdowns are available in **Portfolio → Zakat**.",
                'followups' => ['How does dividend purification work?', 'What plans & pricing does Irshad offer?'],
                'support' => false,
            ],
            'how does dividend purification work' => [
                'reply' => "**Dividend Purification** removes the small (<5%) impermissible income portion embedded in an eligible Halal company's dividends:\n- Open **Portfolio → Purification** to log dividends or run calculations for your holdings.\n- Irshad multiplies the company's impermissible income ratio by your dividend so you know the exact amount to donate to charity to cleanse your wealth.",
                'followups' => ['How do Zakat & Hawl work?', 'How does AAOIFI screening work?'],
                'support' => false,
            ],
            'what plans pricing does irshad offer' => [
                'reply' => $kb['account_billing']['content'] ?? "Irshad offers **Miftah (Free)** for getting started, alongside paid **Pro** and **Max** tiers with higher screening allowances, Zakat & purification tools, alerts, and statements. View details on the **Pricing** page.",
                'followups' => ['How does AAOIFI screening work?', 'I need billing or account help'],
                'support' => false,
            ],
        ];

        $lookupKey = str_replace('zakat & hawl', 'zakat hawl', $norm);
        $lookupKey = str_replace('plans & pricing', 'plans pricing', $lookupKey);

        if (isset($starters[$lookupKey])) {
            $item = $starters[$lookupKey];

            return [
                'reply' => $item['reply'],
                'cited_symbols' => [],
                'suggested_followups' => $item['followups'],
                'needs_human_support' => $item['support'],
                'provider' => 'instant',
            ];
        }

        return null;
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

        $models = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];
        $keyCount = count($apiKeys);

        foreach ($models as $model) {
            for ($attempt = 0; $attempt < $keyCount; $attempt++) {
                $idx = ($startIndex + $attempt) % $keyCount;
                $apiKey = $apiKeys[$idx];

                try {
                    $response = Http::withHeaders([
                        'Content-Type' => 'application/json',
                    ])->withOptions([
                        'force_ip_resolve' => 'v4',
                    ])->timeout(10)->post("{$this->geminiBaseUrl}/{$model}:generateContent?key={$apiKey}", [
                        'systemInstruction' => [
                            'parts' => [['text' => $systemInstruction]],
                        ],
                        'contents' => $contents,
                        'generationConfig' => [
                            'temperature' => 0.25,
                            'maxOutputTokens' => 480,
                            'responseMimeType' => 'application/json',
                        ],
                    ]);

                    if ($response->successful()) {
                        Cache::put('gemini_key_index', $idx);
                        $text = $response->json('candidates.0.content.parts.0.text', '');

                        return $this->parseModelPayload($text);
                    }

                    if ($response->status() === 429) {
                        Log::warning('ChatbotService Gemini key hit 429; rotating key.', ['index' => $idx, 'model' => $model]);
                        continue;
                    }

                    Log::error('ChatbotService Gemini API error', [
                        'model' => $model,
                        'status' => $response->status(),
                        'body' => substr($response->body(), 0, 500),
                    ]);

                    break; // Try next model rather than retrying same bad payload on every key
                } catch (\Throwable $e) {
                    $safeMsg = preg_replace('/key=[^&\s]+/', 'key=***', $e->getMessage()) ?? $e->getMessage();
                    Log::error("ChatbotService Gemini exception ({$model}): {$safeMsg}");

                    break;
                }
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
            ])->timeout(8)->post('https://api.perplexity.ai/chat/completions', [
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

    private function sanitizeOutput(array $parsed, string $provider): array
    {
        $followups = array_values(array_slice(array_filter(
            array_map(fn ($q) => trim((string) $q), (array) ($parsed['suggested_followups'] ?? [])),
            fn ($q) => $q !== ''
        ), 0, 2));

        return [
            'reply' => trim((string) ($parsed['reply'] ?? '')),
            'cited_symbols' => [],
            'suggested_followups' => $followups,
            'needs_human_support' => (bool) ($parsed['needs_human_support'] ?? false),
            'provider' => $provider,
        ];
    }

    private function buildOfflineFallback(string $userMessage, bool $isPublic = false): array
    {
        $lines = [
            "I'm currently operating in quick offline knowledge mode.",
            '- **AAOIFI Screening:** Evaluates business activities plus ratios (<30% debt, <30% cash/deposits, <5% impermissible income). Check individual stocks in the **Market Screener**.',
            '- **Zakat & Hawl:** View your Hawl date and 2.5% calculation under **Portfolio → Zakat**.',
            $isPublic
                ? "\nIf you need direct help from our team, sign in or email **support@irshad.app**."
                : "\nIf you need direct help from our team, tap **Send to Support Team** below.",
        ];

        return [
            'reply' => implode("\n", $lines),
            'cited_symbols' => [],
            'suggested_followups' => [
                'How does AAOIFI screening work?',
                'How do Zakat & Hawl work?',
            ],
            'needs_human_support' => true,
            'provider' => 'fallback',
        ];
    }
}
