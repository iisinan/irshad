<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Holding;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class ChatbotContextService
{
    /**
     * Gather grounded database & knowledge-base context for the user's message.
     *
     * @return array{
     *   prompt_context: string,
     *   matched_companies: array<int, array<string, mixed>>,
     *   matched_resources: array<int, array<string, mixed>>,
     *   kb_sections: array<int, string>,
     *   has_company_mention: bool
     * }
     */
    public function build(User $user, string $message): array
    {
        return $this->formatContextBundle($user, $message);
    }

    /**
     * Gather public-only KB and educational resource context for unauthenticated visitors.
     */
    public function buildPublic(string $message): array
    {
        return $this->formatContextBundle(null, $message);
    }

    private function formatContextBundle(?User $user, string $message): array
    {
        $hasCompanyMention = $this->detectCompanyMention($message);
        $resources = $this->findRelevantResources($message);
        $kbSections = $this->matchKnowledgeBase($message);
        $userSummary = $user
            ? $this->summarizeUser($user)
            : 'Public website visitor (not signed in). Encourage signing in to use portfolio tracking, Zakat & Hawl reminders, and the Market Screener.';

        $blocks = [];

        if (! empty($kbSections)) {
            $blocks[] = "=== IRSHAD PLATFORM KNOWLEDGE BASE ===\n".implode("\n\n", array_map(
                fn (array $section) => "**{$section['title']}**\n{$section['content']}",
                $kbSections
            ));
        }

        $blocks[] = ($user ? '=== CURRENT USER CONTEXT (AUTHENTICATED) ===' : '=== VISITOR CONTEXT (PUBLIC) ===')."\n".$userSummary;

        if ($resources->isNotEmpty()) {
            $resourceLines = $resources->map(
                fn (array $r) => "- [{$r['type']}] {$r['title']}".(! empty($r['scholar']) ? " by {$r['scholar']}" : '').(! empty($r['category']) ? " ({$r['category']})" : '')
            )->implode("\n");

            $blocks[] = "=== MATCHED EDUCATIONAL RESOURCES ===\n".$resourceLines;
        }

        return [
            'prompt_context' => implode("\n\n", $blocks),
            'matched_companies' => [],
            'matched_resources' => $resources->values()->all(),
            'kb_sections' => array_column($kbSections, 'title'),
            'has_company_mention' => $hasCompanyMention,
        ];
    }

    /**
     * Detect whether the message names a listed company or ticker (cached in memory/Redis/file for speed).
     */
    private function detectCompanyMention(string $message): bool
    {
        preg_match_all('/\b[A-Za-z][A-Za-z0-9]{1,14}\b/', $message, $matches);
        $rawTokens = $matches[0] ?? [];
        if (empty($rawTokens)) {
            return false;
        }

        $stopWords = [
            'HALAL', 'HARAM', 'IS', 'ARE', 'WAS', 'THE', 'AND', 'FOR', 'WHAT', 'HOW', 'CAN', 'YOU',
            'ABOUT', 'TELL', 'CHECK', 'STATUS', 'STOCK', 'STOCKS', 'AAOIFI', 'ZAKAT', 'HAWL',
            'MY', 'DO', 'DOES', 'WHY', 'WITH', 'THIS', 'THAT', 'FROM', 'HAVE', 'PLS', 'PLEASE',
            'IRSHAD', 'PLAN', 'PRICING', 'HELP', 'NGX', 'BUY', 'SELL', 'PURIFY', 'PURIFICATION',
            'DIVIDEND', 'DIVIDENDS', 'DATE', 'DEBT', 'CASH', 'RATIO', 'COMPLIANT', 'SUPPORT',
            'HUMAN', 'ADMIN', 'SHARIAH', 'SHARIA', 'SCREENING', 'SCREEN', 'WORK', 'WORKS',
            'QUESTIONABLE', 'NON', 'INVEST', 'INVESTING', 'SHARES', 'SHARE', 'LIMITED', 'GROUP',
            'NIGERIA', 'PLC', 'HOLDINGS', 'BANK', 'INDUSTRIES', 'COMPANY', 'INTERNATIONAL',
            'CAPITAL', 'SERVICES', 'AFRICA', 'TRUST', 'ACCESS', 'FIRST', 'UNITED', 'UNION',
        ];

        $symbolCandidates = [];
        $wordCandidates = [];
        foreach ($rawTokens as $token) {
            $upper = strtoupper($token);
            if (in_array($upper, $stopWords, true)) {
                continue;
            }
            $symbolCandidates[] = $upper;
            if (strlen($token) >= 3) {
                $wordCandidates[] = strtolower($token);
            }
        }

        if (empty($symbolCandidates)) {
            return false;
        }

        // Common colloquial aliases investors type before checking exact tickers
        $aliases = ['mtn', 'dangote', 'zenith', 'guaranty', 'seplat', 'airtel', 'oando', 'nestle', 'lafarge', 'geregu', 'transcorp', 'fbn', 'uba', 'fidelity', 'sterling', 'stanbic', 'flour', 'bua', 'apple', 'tesla', 'nvidia', 'microsoft', 'amazon', 'meta', 'google'];
        foreach ($wordCandidates as $word) {
            if (in_array($word, $aliases, true)) {
                return true;
            }
        }

        $index = Cache::remember('chatbot_company_index_v1', 3600, function () use ($stopWords) {
            try {
                $companies = Company::query()->select(['symbol', 'name'])->get();
                $symbols = [];
                $nameWords = [];

                foreach ($companies as $company) {
                    $sym = strtoupper(trim((string) $company->symbol));
                    if ($sym !== '') {
                        $symbols[$sym] = true;
                    }
                    preg_match_all('/\b[A-Za-z]{4,}\b/', strtolower((string) $company->name), $parts);
                    foreach ($parts[0] ?? [] as $part) {
                        if (! in_array(strtoupper($part), $stopWords, true)) {
                            $nameWords[$part] = true;
                        }
                    }
                }

                return ['symbols' => $symbols, 'words' => $nameWords];
            } catch (\Throwable) {
                return ['symbols' => [], 'words' => []];
            }
        });

        foreach ($symbolCandidates as $sym) {
            if (isset($index['symbols'][$sym])) {
                return true;
            }
        }
        foreach ($wordCandidates as $word) {
            if (isset($index['words'][$word])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Find up to 3 educational resources matching keywords using a cached index (zero per-request LIKE query).
     */
    private function findRelevantResources(string $message): Collection
    {
        preg_match_all('/\b[A-Za-z]{4,}\b/', strtolower($message), $matches);
        $words = array_values(array_diff(array_unique($matches[0] ?? []), [
            'what', 'when', 'where', 'which', 'this', 'that', 'with', 'from', 'have',
            'about', 'please', 'could', 'would', 'should', 'explain', 'irshad', 'help',
            'does', 'work', 'works', 'mean', 'means',
        ]));

        if (empty($words)) {
            return collect();
        }

        $catalog = Cache::remember('chatbot_resources_index_v1', 600, function () {
            try {
                return Resource::query()
                    ->select(['id', 'title', 'type', 'scholar', 'category'])
                    ->latest()
                    ->get()
                    ->map(fn (Resource $r) => [
                        'id' => $r->id,
                        'title' => $r->title,
                        'type' => $r->type,
                        'scholar' => $r->scholar,
                        'category' => $r->category,
                    ])
                    ->all();
            } catch (\Throwable) {
                return [];
            }
        });

        $matched = [];
        foreach ($catalog as $item) {
            $haystack = strtolower(($item['title'] ?? '').' '.($item['category'] ?? ''));
            foreach ($words as $word) {
                if (str_contains($haystack, $word)) {
                    $matched[] = $item;
                    break;
                }
            }
            if (count($matched) >= 3) {
                break;
            }
        }

        return collect($matched);
    }

    /**
     * Select up to 3 relevant static KB sections; falls back to core overview sections.
     *
     * @return array<int, array{title: string, content: string}>
     */
    private function matchKnowledgeBase(string $message): array
    {
        $kb = config('irshad_kb', []);
        $lower = strtolower($message);
        $scored = [];

        foreach ($kb as $key => $section) {
            $score = 0;
            foreach ($section['keywords'] ?? [] as $kw) {
                if (str_contains($lower, strtolower($kw))) {
                    $score++;
                }
            }
            if ($score > 0) {
                $scored[] = ['score' => $score, 'section' => $section];
            }
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        if (empty($scored)) {
            return array_values(array_filter([
                $kb['aaoifi_methodology'] ?? null,
                $kb['platform_features'] ?? null,
            ]));
        }

        return array_map(fn ($item) => $item['section'], array_slice($scored, 0, 3));
    }

    private function summarizeUser(User $user): string
    {
        $tierName = $user->tier->name ?? 'Miftah';
        $tierSlug = $user->tier->slug ?? 'free';
        $hawlDate = $user->preferences['zakat_hawl_date'] ?? null;

        $holdings = Holding::where('user_id', $user->id)
            ->select(['symbol', 'shares'])
            ->limit(15)
            ->get();

        $holdingSummary = $holdings->isEmpty()
            ? 'None recorded yet'
            : $holdings->map(fn ($h) => "{$h->symbol} (".rtrim(rtrim((string) $h->shares, '0'), '.').' shares)')->implode(', ');

        return implode("\n", [
            '- User Name: '.($user->name ?: 'Investor'),
            "- Current Plan: {$tierName} ({$tierSlug})",
            '- Email Verified: '.($user->email_verified_at ? 'Yes' : 'No'),
            '- Zakat Hawl Date Set: '.($hawlDate ?: 'Not configured yet'),
            "- Recorded Holdings ({$holdings->count()}): {$holdingSummary}",
        ]);
    }
}
