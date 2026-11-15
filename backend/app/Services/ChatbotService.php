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
    public function reply(ChatConversation $conversation, string $userMessage, array $contextBundle, ?\App\Models\User $user = null): array
    {
        $history = $this->loadRecentHistory($conversation);

        return $this->generateReply($userMessage, $history, $contextBundle, false, $user);
    }

    /**
     * Generate a stateless public FAQ/tier-aware reply for website visitors.
     *
     * @param  array<int, array{role: string, content: string}>  $history
     * @param  array<string, mixed>  $contextBundle
     */
    public function replyPublic(string $userMessage, array $history, array $contextBundle): array
    {
        return $this->generateReply($userMessage, $history, $contextBundle, true, null);
    }

    /**
     * Fast pre-DB check ONLY for greetings and general starter FAQs (<1ms).
     */
    public function quickPrecheck(string $userMessage, bool $isPublic = false): ?array
    {
        return $this->matchInstantReply($userMessage, $isPublic);
    }

    private function generateReply(string $userMessage, array $history, array $contextBundle, bool $isPublic, ?\App\Models\User $user): array
    {
        $tierUpgrade = $this->detectTierUpgrade($userMessage, $contextBundle, $user);
        if ($tierUpgrade !== null) {
            return $tierUpgrade;
        }

        $accountReply = $this->matchAccountStatusReply($userMessage, $history, $contextBundle, $isPublic);
        if ($accountReply !== null) {
            return $accountReply;
        }

        $instant = $this->matchInstantReply($userMessage, $isPublic);
        if ($instant !== null) {
            return $instant;
        }

        $hasStocks = ! empty($contextBundle['matched_companies']);
        $canCacheFaq = empty($history)
            && ! $hasStocks
            && ! app()->runningUnitTests()
            && ! preg_match('/\b(my\s+(?:tier|plan|subscription|portfolio|holding|holdings|hawl|zakat|account|dividend|dividends|watchlist|basket)|i\s+(?:have|own|hold|bought|sold|paid|was\s+charged)|account|subscription|billing|refund|charge|charged|password|login|verify)\b/i', $userMessage);

        $tierSlug = (string) ($contextBundle['tier']['slug'] ?? ($isPublic ? 'guest' : 'free'));
        $cacheKey = 'chatbot_faq_v4:'.sha1($tierSlug.':'.$this->normalizeQuestion($userMessage));
        if ($canCacheFaq && ($cached = Cache::get($cacheKey)) && is_array($cached)) {
            return $cached;
        }

        $systemInstruction = $this->buildSystemInstruction($contextBundle['prompt_context'] ?? '', $isPublic);

        $geminiResult = $this->askGemini($systemInstruction, $history, $userMessage);
        if ($geminiResult !== null) {
            $output = $this->sanitizeOutput($geminiResult, $contextBundle, 'gemini');
            if ($canCacheFaq && ! empty($output['reply']) && ! ($output['upgrade_required'] ?? false)) {
                Cache::put($cacheKey, $output, 21600);
            }

            return $output;
        }

        $groqResult = $this->askGroq($systemInstruction, $history, $userMessage);
        if ($groqResult !== null) {
            $output = $this->sanitizeOutput($groqResult, $contextBundle, 'groq');
            if ($canCacheFaq && ! empty($output['reply']) && ! ($output['upgrade_required'] ?? false)) {
                Cache::put($cacheKey, $output, 21600);
            }

            return $output;
        }

        $perplexityResult = $this->askPerplexity($systemInstruction, $history, $userMessage);
        if ($perplexityResult !== null) {
            $output = $this->sanitizeOutput($perplexityResult, $contextBundle, 'perplexity');
            if ($canCacheFaq && ! empty($output['reply']) && ! ($output['upgrade_required'] ?? false)) {
                Cache::put($cacheKey, $output, 21600);
            }

            return $output;
        }

        return $this->buildSmartLocalAnswer($userMessage, $contextBundle, $isPublic);
    }

    /**
     * Deterministically answer questions about the user's current detected tier, plan quotas, Hawl, or holdings.
     *
     * @param  array<int, array{role: string, content: string}>  $history
     * @return array<string, mixed>|null
     */
    private function matchAccountStatusReply(string $userMessage, array $history, array $contextBundle, bool $isPublic): ?array
    {
        if ($isPublic) {
            return null;
        }

        $lower = $this->normalizeQuestion($userMessage);
        $asksPlanOrAccount = preg_match('/\b(what(?:\s+is|s)?\s+my\s+(?:plan|tier|subscription|quota|limit)|which\s+(?:plan|tier)\s+am\s+i|am\s+i\s+on\s+(?:miftah|rawdha|noor|free|pro|max)|check\s+my\s+(?:plan|tier|subscription|account)|my\s+current\s+(?:plan|tier))\b/i', $lower) === 1;

        if (! $asksPlanOrAccount && preg_match('/\b(check\s+again|recheck|refresh|sure|really)\b/i', $lower) && ! empty($history)) {
            $lastUser = '';
            for ($i = count($history) - 1; $i >= 0; $i--) {
                if (($history[$i]['role'] ?? '') === 'user') {
                    $lastUser = $this->normalizeQuestion((string) ($history[$i]['content'] ?? ''));
                    break;
                }
            }
            if (preg_match('/\b(plan|tier|subscription|miftah|rawdha|noor|quota)\b/i', $lastUser)) {
                $asksPlanOrAccount = true;
            }
        }

        if (! $asksPlanOrAccount) {
            return null;
        }

        return [
            'reply' => $this->formatAccountStatusMarkdown($contextBundle),
            'cited_symbols' => [],
            'suggested_followups' => [
                'What plans & pricing does Irshad offer?',
                'Is MTNN Halal?',
            ],
            'needs_human_support' => false,
            'upgrade_required' => false,
            'required_tier' => null,
            'provider' => 'account',
        ];
    }

    private function formatAccountStatusMarkdown(array $contextBundle): string
    {
        $tier = $contextBundle['tier'] ?? [];
        $profile = $contextBundle['user_profile'] ?? [];
        $tierSlug = (string) ($tier['slug'] ?? 'free');
        $tierName = (string) ($tier['name'] ?? 'Miftah');
        $features = (array) ($tier['features'] ?? []);

        $tierLabel = match ($tierSlug) {
            'max' => '**Noor (Max)**',
            'pro' => '**Rawdha (Pro)**',
            default => '**Miftah (Free)**',
        };

        $screensLimit = (int) ($features['stock_screens_per_month'] ?? 3);
        $screensUsed = (int) ($profile['screens_used'] ?? 0);
        $screensText = $screensLimit === -1 ? 'Unlimited' : "{$screensUsed} / {$screensLimit} used this month";
        $portfolioLimit = (int) ($features['portfolio_limit'] ?? 3);
        $holdingsCount = (int) ($profile['holdings_count'] ?? 0);
        $holdingsText = $portfolioLimit === -1 ? "{$holdingsCount} (Unlimited)" : "{$holdingsCount} / {$portfolioLimit} limit";

        $lines = [
            "You are currently on the {$tierLabel} plan.",
            "- **Monthly Stock Screens:** {$screensText}",
            "- **Portfolio Holdings:** {$holdingsText}",
            '- **Zakat Calculator & Hawl:** '.(! empty($features['zakat_calc']) ? 'Included' : 'Requires Rawdha (Pro) or Noor (Max)'),
            '- **Purifications / Month:** '.(((int) ($features['purifications_per_month'] ?? 0)) === -1 ? 'Unlimited' : (((int) ($features['purifications_per_month'] ?? 0)) > 0 ? $features['purifications_per_month'] : 'Requires Rawdha (Pro) or Noor (Max)')),
            '- **Monthly Spotlight & Drift Tracking:** '.(! empty($features['monthly_spotlight']) ? 'Included' : 'Requires Noor (Max)'),
        ];

        if (! empty($profile['hawl_date'])) {
            $lines[] = "- **Your Hawl Date:** {$profile['hawl_date']}";
        }

        if ($tierSlug === 'free') {
            $lines[] = "\nUpgrade to **Rawdha (Pro)** or **Noor (Max)** on **Pricing Plans** whenever you're ready for higher limits and automated Zakat, purification, and alerts.";
        } elseif ($tierSlug === 'pro') {
            $lines[] = "\nUpgrade to **Noor (Max)** on **Pricing Plans** for unlimited quotas, Compliance Drift Tracking, Dividend Alerts, and Monthly Spotlight.";
        }

        return implode("\n", $lines);
    }

    private function buildSystemInstruction(string $groundedContext, bool $isPublic = false): string
    {
        $supportRule = $isPublic
            ? '4. If the user asks about personal billing, account recovery, missing stocks, or direct human help, set `"needs_human_support": true` and invite them to sign in or email support@irshad.app.'
            : '4. If the user asks about billing disputes, double charges, missing stocks, broken features, account recovery, or explicitly asks to talk to a human/admin, set `"needs_human_support": true` and advise them they can tap **Send to Support Team** to route this chat to Irshad admins.';

        return <<<PROMPT
You are **Irshad Assistant**, the fast in-app AI support & Islamic finance assistant for **Irshad** (an AAOIFI-aligned Halal stock screening, portfolio purification, and Zakat platform focused on the NGX).

RULES & GUARDRAILS:
1. Keep replies crisp, warm, structured, and concise (under 120 words using clean markdown bullets unless detail is asked). Never mention "Qistal".
2. TIER AWARENESS: Check the user's **Detected Tier & Features** in CONTEXT. Answer any question that is within their tier (including exact company AAOIFI status/ratios/price from CONTEXT when present). Only if a requested capability/quota is beyond their detected tier, politely state their current tier and advise upgrading to **Rawdha (Pro)** or **Noor (Max)** (and set `"upgrade_required": true` with `"required_tier": "pro"` or `"max"`).
3. Only cite stock statuses, ratios, prices, or holdings present in CONTEXT; never guess numbers or issue formal fatwas / buy-sell advice.
{$supportRule}
5. Output ONLY a valid JSON object with these exact keys (no code fences):
{
  "reply": "<concise markdown answer>",
  "cited_symbols": ["<UPPERCASE ticker symbols referenced from CONTEXT, or empty array>"],
  "suggested_followups": ["<2 short natural next questions>"],
  "needs_human_support": false,
  "upgrade_required": false,
  "required_tier": null
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

    /**
     * Detect if the user's question requires a feature or monthly quota beyond their current tier.
     *
     * @return array<string, mixed>|null
     */
    private function detectTierUpgrade(string $message, array $contextBundle, ?\App\Models\User $user): ?array
    {
        $tier = $contextBundle['tier'] ?? [];
        if ($tier['is_admin'] ?? false) {
            return null;
        }

        $tierSlug = (string) ($tier['slug'] ?? 'free');
        $tierName = (string) ($tier['name'] ?? 'Miftah');
        $features = (array) ($tier['features'] ?? []);
        $stockGate = (array) ($contextBundle['stock_gate'] ?? ['allowed' => true]);
        $lower = $this->normalizeQuestion($message);

        // 1. Monthly stock screen gate (Guest has 0 screens, Miftah has 3/mo, Rawdha has 10/mo, Noor is unlimited)
        if (! ($stockGate['allowed'] ?? true)) {
            $symbol = $stockGate['blocked_symbol'] ?? 'that stock';
            if (($stockGate['reason'] ?? '') === 'guest') {
                return $this->upgradeResponse(
                    "You're currently browsing as a **Guest (not signed in)**. Individual stock compliance screenings (such as **{$symbol}**) are available once you sign in:\n- **Miftah (Free):** 3 stock screens/month\n- **Rawdha (Pro):** 10 stock screens/month, Zakat, Purification & Watchlist\n- **Noor (Max):** Unlimited screens, Drift Tracking & Monthly Spotlight",
                    'login',
                    'stock_screens_per_month',
                    ['What plans & pricing does Irshad offer?', 'How does AAOIFI screening work?']
                );
            }

            $limit = (int) ($stockGate['limit'] ?? 3);
            $targetTier = ($tierSlug === 'free') ? 'pro' : 'max';
            $targetLabel = $targetTier === 'pro' ? '**Rawdha (Pro)** (10 screens/month) or **Noor (Max)** (unlimited)' : '**Noor (Max)** (unlimited stock screens)';

            return $this->upgradeResponse(
                "You've reached your monthly limit of **{$limit} stock screenings** on the **{$tierName}** plan (checking **{$symbol}** is beyond your current tier allowance).\n\nPlease upgrade to {$targetLabel} on Pricing to continue screening additional stocks this month.",
                $targetTier,
                'stock_screens_per_month',
                ['What plans & pricing does Irshad offer?', 'I need billing or account help']
            );
        }

        // Unlisted stock check by a Guest (e.g. "Is Apple halal?")
        if ($tierSlug === 'guest' && preg_match('/\b(?:is|are|check)\s+[a-z0-9&.\-\s]{2,30}?\s+(?:halal|haram|compliant|shariah[\s-]*compliant)\b/i', $lower)) {
            if (! preg_match('/\b(aaoifi|dividend|dividends|zakat|investing|stocks\s+in\s+general)\b/i', $lower)) {
                return $this->upgradeResponse(
                    "You're browsing as a **Guest (not signed in)**. Sign in with a free **Miftah** account (3 stock screens/month) or upgrade to **Rawdha (Pro)** / **Noor (Max)** to screen specific stocks.",
                    'login',
                    'stock_screens_per_month',
                    ['What plans & pricing does Irshad offer?', 'How does AAOIFI screening work?']
                );
            }
        }

        // 2. Noor (Max)-exclusive capabilities
        if (preg_match('/\b(monthly\s+spotlight|spotlight\s+(?:insight|insights|digest|report))\b/i', $lower) && empty($features['monthly_spotlight'])) {
            return $this->upgradeResponse(
                "**Monthly Spotlight** full insights and digests are exclusive to the **Noor (Max)** plan, which is beyond your current **{$tierName}** tier.\n\nUpgrade to **Noor (Max)** on Pricing to unlock Monthly Spotlight insights along with unlimited screens and compliance drift tracking.",
                'max',
                'monthly_spotlight'
            );
        }

        if (preg_match('/\b(drift\s+track(?:ing)?|compliance\s+drift|drift\s+alert|drift\s+alerts|notify\s+me\s+when.*changes|alert\s+when.*non[\s-]*compliant)\b/i', $lower) && empty($features['drift_tracking'])) {
            return $this->upgradeResponse(
                "**90-day Compliance Drift Tracking & Alerts** are exclusive to the **Noor (Max)** plan and beyond your current **{$tierName}** tier.\n\nUpgrade to **Noor (Max)** to monitor holding compliance changes automatically.",
                'max',
                'drift_tracking'
            );
        }

        if (preg_match('/\b(dividend\s+alert|dividend\s+alerts|notify\s+.*dividend|alert\s+.*dividend)\b/i', $lower) && empty($features['dividend_alerts'])) {
            return $this->upgradeResponse(
                "**Dividend Alerts** require the **Noor (Max)** plan and are beyond your current **{$tierName}** tier.\n\nUpgrade to **Noor (Max)** on Pricing to receive dividend notifications.",
                'max',
                'dividend_alerts'
            );
        }

        // 3. Rawdha (Pro) / Noor (Max) gated capabilities
        if (preg_match('/\b(calculate\s+(?:my\s+)?zakat|my\s+zakat|zakat\s+calculator|zakat\s+due|how\s+much\s+zakat|track\s+(?:my\s+)?hawl|set\s+(?:my\s+)?hawl|hawl\s+tracker)\b/i', $lower) && empty($features['zakat_calc'])) {
            return $this->upgradeResponse(
                "Automated **Zakat calculation & Hawl tracking** are available on **Rawdha (Pro)** and **Noor (Max)** plans, which is beyond your current **{$tierName}** tier.\n\nUpgrade on Pricing to unlock automated portfolio Zakat calculations.",
                $tierSlug === 'guest' ? 'login' : 'pro',
                'zakat_calc'
            );
        }

        if (preg_match('/\b(purify\s+my|calculate\s+(?:my\s+)?purification|my\s+purification|purification\s+calculator|how\s+much\s+(?:should\s+i|to)\s+purify|purification\s+amount)\b/i', $lower)) {
            $purifLimit = (int) ($features['purifications_per_month'] ?? 0);
            if ($purifLimit === 0) {
                return $this->upgradeResponse(
                    "Automated **Dividend Purification** calculations are available on **Rawdha (Pro)** (2/month) and **Noor (Max)** (unlimited), beyond your current **{$tierName}** tier.\n\nUpgrade on Pricing to run purification calculations automatically.",
                    $tierSlug === 'guest' ? 'login' : 'pro',
                    'purifications_per_month'
                );
            }
            if ($purifLimit > 0 && $user && ! $this->safeCanUseFeature($user, 'purifications_per_month')) {
                return $this->upgradeResponse(
                    "You've used all **{$purifLimit} monthly purification calculations** on your **{$tierName}** plan.\n\nUpgrade to **Noor (Max)** for unlimited dividend purifications.",
                    'max',
                    'purifications_per_month'
                );
            }
        }

        if (preg_match('/\b(my\s+watchlist|add\s+to\s+watchlist|watchlist\s+track|use\s+watchlist)\b/i', $lower) && ((int) ($features['watchlist_limit'] ?? 0) === 0)) {
            return $this->upgradeResponse(
                "**Watchlist tracking** is included on **Rawdha (Pro)** (2 stocks) and **Noor (Max)** (unlimited), beyond your current **{$tierName}** tier.\n\nUpgrade on Pricing to build and track a watchlist.",
                $tierSlug === 'guest' ? 'login' : 'pro',
                'watchlist_limit'
            );
        }

        if (preg_match('/\b(thematic\s+basket|custom\s+basket|investing\s+basket|halal\s+basket|my\s+baskets|create\s+.*basket)\b/i', $lower) && ((int) ($features['baskets'] ?? 0) === 0)) {
            return $this->upgradeResponse(
                "**Curated & custom investing baskets** require **Rawdha (Pro)** (3 baskets) or **Noor (Max)** (unlimited), beyond your current **{$tierName}** tier.\n\nUpgrade on Pricing to access thematic Halal baskets.",
                $tierSlug === 'guest' ? 'login' : 'pro',
                'baskets'
            );
        }

        if (preg_match('/\b(import\s+.*statement|broker\s+statement|upload\s+statement|statement\s+import)\b/i', $lower) && empty($features['statements'])) {
            return $this->upgradeResponse(
                "**Broker statement imports** require **Rawdha (Pro)** or **Noor (Max)**, beyond your current **{$tierName}** tier.\n\nUpgrade on Pricing to import statements and history.",
                $tierSlug === 'guest' ? 'login' : 'pro',
                'statements'
            );
        }

        return null;
    }

    private function safeCanUseFeature(\App\Models\User $user, string $featureKey): bool
    {
        try {
            if (! \Illuminate\Support\Facades\Schema::hasTable('user_usages')) {
                return true;
            }

            return SubscriptionService::canUseFeature($user, $featureKey);
        } catch (\Throwable) {
            return true;
        }
    }

    private function upgradeResponse(string $reply, string $requiredTier, string $feature, ?array $followups = null): array
    {
        return [
            'reply' => $reply,
            'cited_symbols' => [],
            'suggested_followups' => $followups ?? [
                'What plans & pricing does Irshad offer?',
                'How does AAOIFI screening work?',
            ],
            'needs_human_support' => false,
            'upgrade_required' => true,
            'required_tier' => $requiredTier,
            'upgrade_feature' => $feature,
            'provider' => 'tier_gate',
        ];
    }

    private function matchInstantReply(string $userMessage, bool $isPublic): ?array
    {
        $norm = $this->normalizeQuestion($userMessage);

        if (in_array($norm, ['hi', 'hello', 'hey', 'salam', 'salams', 'assalamu alaikum', 'as salamu alaykum'], true)) {
            return [
                'reply' => "As-salamu alaykum! How can I help you today? You can ask me about **NGX stock compliance**, **AAOIFI screening rules**, **Zakat & Hawl**, **dividend purification**, or your **Irshad plan & billing**.",
                'cited_symbols' => [],
                'suggested_followups' => [
                    'How does AAOIFI screening work?',
                    'Is MTNN Halal?',
                ],
                'needs_human_support' => false,
                'upgrade_required' => false,
                'required_tier' => null,
                'provider' => 'instant',
            ];
        }

        $kb = config('irshad_kb', []);
        $starters = [
            'how does aaoifi screening work' => [
                'reply' => "Irshad applies **AAOIFI Shariah Standard No. 21** across two stages:\n- **Business Activity Screen:** Excludes companies with core revenue from prohibited sectors (conventional interest banking/insurance, alcohol, gambling, tobacco, pork, adult entertainment, prohibited weapons).\n- **Financial Ratio Screen:** Requires conventional debt < **30%** of market cap, interest-bearing cash/deposits < **30%** of market cap, and impermissible income < **5%** of total revenue.",
                'followups' => ['Is MTNN Halal?', 'How do Zakat & Hawl work?'],
                'support' => false,
            ],
            'how do zakat hawl work' => [
                'reply' => "Irshad supports **2.5% annual Zakat** once wealth remains above **Nisab** for one full lunar year (**Hawl**):\n- Set your Hawl date once under **Profile** or **Portfolio → Zakat**.\n- Automated Zakat calculation and Hawl tracking are unlocked on **Rawdha (Pro)** and **Noor (Max)** plans.",
                'followups' => ['How does dividend purification work?', 'What plans & pricing does Irshad offer?'],
                'support' => false,
            ],
            'how does dividend purification work' => [
                'reply' => "**Dividend Purification** removes the small (<5%) impermissible income portion embedded in an eligible Halal company's dividends by multiplying the impermissible income ratio by your dividend to calculate what to donate to charity.\n\nAutomated purification calculations are included on **Rawdha (Pro)** (2/month) and **Noor (Max)** (unlimited) under **Portfolio → Purification**.",
                'followups' => ['How do Zakat & Hawl work?', 'What plans & pricing does Irshad offer?'],
                'support' => false,
            ],
            'what plans pricing does irshad offer' => [
                'reply' => $kb['account_billing']['content'] ?? "Irshad offers **Miftah (Free)**, **Rawdha (Pro)**, and **Noor (Max)**. Visit **Pricing** to compare plans or upgrade.",
                'followups' => ['How does AAOIFI screening work?', 'I need billing or account help'],
                'support' => false,
            ],
        ];

        $lookupKey = str_replace(['zakat & hawl', 'plans & pricing'], ['zakat hawl', 'plans pricing'], $norm);

        if (isset($starters[$lookupKey])) {
            $item = $starters[$lookupKey];

            return [
                'reply' => $item['reply'],
                'cited_symbols' => [],
                'suggested_followups' => $item['followups'],
                'needs_human_support' => $item['support'],
                'upgrade_required' => false,
                'required_tier' => null,
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
            ->reorder('id', 'desc')
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

        $models = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite'];
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

    private function askGroq(string $systemInstruction, array $history, string $userMessage): ?array
    {
        $apiKey = trim((string) env('GROQ_API_KEY', ''));
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
            ])->timeout(8)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => env('GROQ_MODEL', 'llama-3.1-8b-instant'),
                'messages' => $messages,
                'temperature' => 0.25,
                'max_tokens' => 480,
            ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content', '');

                return $this->parseModelPayload($content);
            }
        } catch (\Throwable $e) {
            Log::warning('ChatbotService Groq exception: '.$e->getMessage());
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
        ), 0, 2));

        return [
            'reply' => trim((string) ($parsed['reply'] ?? '')),
            'cited_symbols' => $cited,
            'suggested_followups' => $followups,
            'needs_human_support' => (bool) ($parsed['needs_human_support'] ?? false),
            'upgrade_required' => (bool) ($parsed['upgrade_required'] ?? false),
            'required_tier' => $parsed['required_tier'] ?? null,
            'provider' => $provider,
        ];
    }

    /**
     * Resilient deterministic local answer engine so the chatboard always answers accurately even when all LLM tokens are exhausted.
     */
    private function buildSmartLocalAnswer(string $userMessage, array $contextBundle, bool $isPublic = false): array
    {
        $companyDetails = $contextBundle['company_details'] ?? [];
        $companies = $contextBundle['matched_companies'] ?? [];
        $kbSections = $contextBundle['kb_matched_sections'] ?? [];
        $resources = $contextBundle['matched_resources'] ?? [];
        $lower = strtolower($userMessage);

        $lines = [];
        $followups = [
            'How does AAOIFI screening work?',
            'What plans & pricing does Irshad offer?',
        ];
        $needsSupport = false;

        if (! empty($companyDetails)) {
            foreach ($companyDetails as $c) {
                $statusLabel = strtoupper((string) ($c['status'] ?? 'unscreened'));
                $verifiedText = ! empty($c['verified_by_scholar']) ? 'Scholar-verified' : 'Automated AAOIFI screening';
                $priceText = $c['latest_price'] !== null ? ' · NGN '.number_format((float) $c['latest_price'], 2) : '';

                $lines[] = "**{$c['name']} ({$c['symbol']})**{$priceText}";
                $lines[] = "- **Status:** **{$statusLabel}** ({$verifiedText})";
                if (! empty($c['screening'])) {
                    $s = $c['screening'];
                    $lines[] = sprintf(
                        '- **AAOIFI Ratios:** Business: **%s** | Debt: **%.2f%%** (<30%%) | Cash: **%.2f%%** (<30%%) | Impermissible Income: **%.2f%%** (<5%%)',
                        $s['business_status'],
                        $s['debt_ratio'],
                        $s['cash_ratio'],
                        $s['impermissible_income_ratio']
                    );
                }
                if (! empty($c['activity_reason'])) {
                    $lines[] = "- **Note:** {$c['activity_reason']}";
                }
            }
            $followups = ['How does dividend purification work?', 'How do Zakat & Hawl work?'];
        } elseif (! $isPublic && preg_match('/\b(my\s+(?:plan|tier|subscription|hawl|holdings|portfolio|quota|limit)|what\s+tier|which\s+plan)\b/i', $lower)) {
            $lines[] = $this->formatAccountStatusMarkdown($contextBundle);
        } elseif (! empty($kbSections)) {
            foreach (array_slice($kbSections, 0, 2) as $idx => $section) {
                if ($idx > 0) {
                    $lines[] = '';
                }
                $lines[] = "**{$section['title']}**";
                $lines[] = trim((string) $section['content']);
            }
            $needsSupport = (bool) preg_match('/\b(support|human|admin|bug|error|refund|charged|billing dispute|broken|reset)\b/i', $lower);
        } else {
            $lines[] = "Here is what I can help with directly right now:";
            $lines[] = '- **NGX Stock Screening:** Ask about a ticker/company (within your plan\'s monthly screen quota) for its AAOIFI status and ratios.';
            $lines[] = '- **Zakat, Hawl & Purification:** Ask how AAOIFI Standard No. 21, Hawl tracking, or dividend cleansing work.';
            $lines[] = '- **Plans & Account:** Ask about your active tier (**Miftah**, **Rawdha Pro**, **Noor Max**) or support help.';
            $needsSupport = true;
        }

        if (! empty($resources)) {
            $lines[] = "\n**Related Irshad Resources:**";
            foreach (array_slice($resources, 0, 2) as $r) {
                $lines[] = "- [{$r['type']}] {$r['title']}".(! empty($r['scholar']) ? " — {$r['scholar']}" : '');
            }
        }

        if ($needsSupport) {
            $lines[] = $isPublic
                ? "\nNeed direct assistance? Sign in or email **support@irshad.app**."
                : "\nNeed direct help from an admin? Tap **Send to Support Team** below.";
        }

        return [
            'reply' => implode("\n", $lines),
            'cited_symbols' => array_column($companies, 'symbol'),
            'suggested_followups' => $followups,
            'needs_human_support' => $needsSupport,
            'upgrade_required' => false,
            'required_tier' => null,
            'provider' => 'local_kb',
        ];
    }
}
