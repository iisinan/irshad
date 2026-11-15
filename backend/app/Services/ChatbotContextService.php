<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Holding;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class ChatbotContextService
{
    /**
     * Gather tier-aware grounded database & knowledge-base context for the user's message.
     *
     * @return array{
     *   prompt_context: string,
     *   matched_companies: array<int, array<string, mixed>>,
     *   matched_resources: array<int, array<string, mixed>>,
     *   kb_sections: array<int, string>,
     *   tier: array<string, mixed>,
     *   stock_gate: array<string, mixed>,
     *   user_id: int|null
     * }
     */
    public function build(User $user, string $message): array
    {
        return $this->formatContextBundle($user, $message);
    }

    /**
     * Gather public-only KB and guest-tier context for unauthenticated visitors.
     */
    public function buildPublic(string $message): array
    {
        return $this->formatContextBundle(null, $message);
    }

    private function formatContextBundle(?User $user, string $message): array
    {
        $tierInfo = $this->resolveTierInfo($user);
        $matchedCandidates = $this->matchCompanyCandidates($message);
        $stockGate = $this->evaluateStockGate($user, $tierInfo, $matchedCandidates);

        $companies = collect();
        if (! empty($matchedCandidates) && ($stockGate['allowed'] ?? false)) {
            $ids = array_column($matchedCandidates, 'id');
            $companies = Company::with(['status:id,company_id,status,verified_by_scholar', 'aaoifiScreening'])
                ->select(['id', 'name', 'symbol', 'sector', 'current_status', 'latest_price', 'activity_reason'])
                ->whereIn('id', $ids)
                ->limit(3)
                ->get();

            if ($user && ! ($tierInfo['is_admin'] ?? false)) {
                foreach ($companies as $company) {
                    $this->safeRecordStockScreen($user, (string) $company->symbol);
                }
            }
        }

        $resources = $this->findRelevantResources($message);
        $kbSections = $this->matchKnowledgeBase($message);
        $userProfileData = $user ? $this->buildUserProfileData($user, $tierInfo) : null;
        $userSummary = $user
            ? $this->summarizeUser($userProfileData, $tierInfo)
            : $this->summarizeGuest($tierInfo);

        $blocks = [];

        if (! empty($kbSections)) {
            $blocks[] = "=== IRSHAD PLATFORM KNOWLEDGE BASE ===\n".implode("\n\n", array_map(
                fn (array $section) => "**{$section['title']}**\n{$section['content']}",
                $kbSections
            ));
        }

        $blocks[] = ($user ? '=== CURRENT USER & TIER CONTEXT (AUTHENTICATED) ===' : '=== VISITOR & TIER CONTEXT (PUBLIC GUEST) ===')."\n".$userSummary;

        $companyDetails = [];
        if ($companies->isNotEmpty()) {
            $companyLines = $companies->map(function (Company $company) use (&$companyDetails) {
                $screening = $company->aaoifiScreening;
                $status = $company->status?->status ?? $screening?->final_status ?? $company->current_status ?? 'unscreened';
                $verified = (bool) ($company->status?->verified_by_scholar ?? false);

                $detail = [
                    'symbol' => $company->symbol,
                    'name' => $company->name,
                    'sector' => $company->sector ?: 'N/A',
                    'status' => $status,
                    'verified_by_scholar' => $verified,
                    'latest_price' => $company->latest_price !== null ? (float) $company->latest_price : null,
                    'activity_reason' => $company->activity_reason,
                    'screening' => $screening ? [
                        'business_status' => $screening->business_status ?? 'N/A',
                        'debt_ratio' => (float) ($screening->debt_ratio ?? 0),
                        'cash_ratio' => (float) ($screening->cash_ratio ?? 0),
                        'impermissible_income_ratio' => (float) ($screening->impermissible_income_ratio ?? 0),
                        'final_status' => $screening->final_status ?? $status,
                    ] : null,
                ];
                $companyDetails[] = $detail;

                $line = "- {$company->name} ({$company->symbol}) | Sector: {$detail['sector']}"
                    ." | Compliance Status: {$status} | Scholar Verified: ".($verified ? 'Yes' : 'No');

                if ($detail['latest_price'] !== null) {
                    $line .= ' | Latest Price: NGN '.number_format($detail['latest_price'], 2);
                }

                if ($detail['screening']) {
                    $line .= sprintf(
                        ' | AAOIFI Business: %s | Debt Ratio: %.2f%% (<30%% limit) | Cash Ratio: %.2f%% (<30%% limit) | Impermissible Income: %.2f%% (<5%% limit) | Final Screening: %s',
                        $detail['screening']['business_status'],
                        $detail['screening']['debt_ratio'],
                        $detail['screening']['cash_ratio'],
                        $detail['screening']['impermissible_income_ratio'],
                        $detail['screening']['final_status']
                    );
                }

                if (! empty($company->activity_reason)) {
                    $line .= ' | Activity Note: '.$company->activity_reason;
                }

                return $line;
            })->implode("\n");

            $blocks[] = "=== MATCHED NGX STOCKS FROM IRSHAD DATABASE ===\n".$companyLines;
        }

        if ($resources->isNotEmpty()) {
            $resourceLines = $resources->map(
                fn (array $r) => "- [{$r['type']}] {$r['title']}".(! empty($r['scholar']) ? " by {$r['scholar']}" : '').(! empty($r['category']) ? " ({$r['category']})" : '')
            )->implode("\n");

            $blocks[] = "=== MATCHED EDUCATIONAL RESOURCES ===\n".$resourceLines;
        }

        return [
            'prompt_context' => implode("\n\n", $blocks),
            'matched_companies' => $companies->map(fn (Company $c) => [
                'symbol' => $c->symbol,
                'name' => $c->name,
                'status' => $c->status?->status ?? $c->aaoifiScreening?->final_status ?? $c->current_status ?? 'unknown',
            ])->values()->all(),
            'company_details' => $companyDetails,
            'matched_resources' => $resources->values()->all(),
            'kb_sections' => array_column($kbSections, 'title'),
            'kb_matched_sections' => $kbSections,
            'tier' => $tierInfo,
            'stock_gate' => $stockGate,
            'user_profile' => $userProfileData,
            'user_id' => $user?->id,
        ];
    }

    /**
     * Resolve effective subscription tier name, slug, and feature limits cleanly from $user->tier.
     *
     * @return array<string, mixed>
     */
    private function resolveTierInfo(?User $user): array
    {
        if (! $user) {
            return [
                'slug' => 'guest',
                'name' => 'Guest (Not Signed In)',
                'is_admin' => false,
                'features' => [
                    'stock_screens_per_month' => 0,
                    'portfolio_limit' => 0,
                    'watchlist_limit' => 0,
                    'baskets' => 0,
                    'statements' => false,
                    'purifications_per_month' => 0,
                    'zakat_calc' => false,
                    'dividend_alerts' => false,
                    'drift_tracking' => false,
                    'monthly_spotlight' => false,
                ],
            ];
        }

        $user->loadMissing('activeSubscription.plan');
        $tier = $user->tier;

        return [
            'slug' => (string) ($tier->slug ?? 'free'),
            'name' => (string) ($tier->name ?? 'Miftah'),
            'is_admin' => false,
            'features' => (array) ($tier->features ?? []),
        ];
    }

    /**
     * Fast in-memory match against cached company symbols & distinctive names (0 SQL queries on general chat).
     *
     * @return array<int, array{id: int, symbol: string}>
     */
    private function matchCompanyCandidates(string $message): array
    {
        preg_match_all('/\b[A-Za-z][A-Za-z0-9]{1,14}\b/', $message, $matches);
        $rawTokens = $matches[0] ?? [];
        if (empty($rawTokens)) {
            return [];
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
            'TIER', 'UPGRADE', 'RAWDA', 'RAWDHA', 'NOOR', 'MIFTAH', 'SPOTLIGHT', 'DRIFT',
            'WATCHLIST', 'BASKET', 'BASKETS', 'STATEMENT', 'STATEMENTS', 'CALC', 'CALCULATE',
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
                $wordCandidates[] = $upper;
            }
        }

        if (empty($symbolCandidates)) {
            return [];
        }

        $catalog = Cache::remember('chatbot_company_lookup_v2', 3600, function () use ($stopWords) {
            try {
                return Company::query()
                    ->select(['id', 'symbol', 'name'])
                    ->get()
                    ->map(function (Company $c) use ($stopWords) {
                        preg_match_all('/\b[A-Za-z]{3,}\b/', strtoupper((string) $c->name), $parts);
                        $nameWords = array_values(array_diff($parts[0] ?? [], $stopWords));

                        return [
                            'id' => (int) $c->id,
                            'symbol' => strtoupper(trim((string) $c->symbol)),
                            'words' => $nameWords,
                        ];
                    })
                    ->all();
            } catch (\Throwable) {
                return [];
            }
        });

        $matched = [];
        $symbolSet = array_flip(array_unique($symbolCandidates));
        $wordSet = array_flip(array_unique($wordCandidates));

        // 1. Exact ticker symbol match first
        foreach ($catalog as $row) {
            if ($row['symbol'] !== '' && isset($symbolSet[$row['symbol']])) {
                $matched[$row['id']] = ['id' => $row['id'], 'symbol' => $row['symbol']];
                if (count($matched) >= 3) {
                    return array_values($matched);
                }
            }
        }

        // 2. Distinctive company-name token match (e.g. "MTN" -> "MTNN", "Dangote" -> "DANGCEM")
        foreach ($catalog as $row) {
            if (isset($matched[$row['id']])) {
                continue;
            }
            foreach ($row['words'] as $w) {
                if (isset($wordSet[$w])) {
                    $matched[$row['id']] = ['id' => $row['id'], 'symbol' => $row['symbol']];
                    if (count($matched) >= 3) {
                        return array_values($matched);
                    }
                    break;
                }
            }
        }

        return array_values($matched);
    }

    /**
     * Evaluate whether the user's tier permits screening matched company symbols.
     *
     * @param  array<int, array{id: int, symbol: string}>  $candidates
     * @return array<string, mixed>
     */
    private function evaluateStockGate(?User $user, array $tierInfo, array $candidates): array
    {
        if (empty($candidates)) {
            return ['allowed' => true, 'blocked_symbol' => null];
        }

        if (! $user) {
            return [
                'allowed' => false,
                'reason' => 'guest',
                'blocked_symbol' => $candidates[0]['symbol'],
                'required_tier' => 'login',
                'limit' => 0,
            ];
        }

        if ($tierInfo['is_admin'] ?? false) {
            return ['allowed' => true, 'blocked_symbol' => null];
        }

        $limit = (int) ($tierInfo['features']['stock_screens_per_month'] ?? 3);
        if ($limit === -1) {
            return ['allowed' => true, 'blocked_symbol' => null];
        }

        foreach ($candidates as $candidate) {
            if (! $this->safeCanScreenStock($user, $candidate['symbol'])) {
                return [
                    'allowed' => false,
                    'reason' => 'limit_reached',
                    'blocked_symbol' => $candidate['symbol'],
                    'required_tier' => ($tierInfo['slug'] ?? 'free') === 'free' ? 'pro' : 'max',
                    'limit' => $limit,
                ];
            }
        }

        return ['allowed' => true, 'blocked_symbol' => null];
    }

    private function safeCanScreenStock(User $user, string $symbol): bool
    {
        try {
            if (! Schema::hasTable('user_usages')) {
                return true;
            }

            return SubscriptionService::canScreenStock($user, $symbol);
        } catch (\Throwable) {
            return true;
        }
    }

    private function safeRecordStockScreen(User $user, string $symbol): void
    {
        try {
            if (! Schema::hasTable('user_usages')) {
                return;
            }

            SubscriptionService::recordStockScreen($user, $symbol);
        } catch (\Throwable) {
            // Non-blocking metrics recording
        }
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

    /**
     * @return array<string, mixed>
     */
    private function buildUserProfileData(User $user, array $tierInfo): array
    {
        $hawlDate = $user->preferences['zakat_hawl_date'] ?? null;

        $holdings = Holding::where('user_id', $user->id)
            ->select(['symbol', 'shares'])
            ->limit(15)
            ->get();

        $screensUsed = 0;
        try {
            if (Schema::hasTable('user_usages')) {
                $screensUsed = SubscriptionService::getFeatureUsageCount($user, 'stock_screens_per_month');
            }
        } catch (\Throwable) {
            $screensUsed = 0;
        }

        return [
            'name' => $user->name ?: 'Investor',
            'email_verified' => (bool) $user->email_verified_at,
            'hawl_date' => $hawlDate,
            'holdings_count' => $holdings->count(),
            'holdings_preview' => $holdings->isEmpty()
                ? 'None recorded yet'
                : $holdings->map(fn ($h) => "{$h->symbol} (".rtrim(rtrim((string) $h->shares, '0'), '.').' shares)')->implode(', '),
            'screens_used' => $screensUsed,
            'screens_limit' => (int) ($tierInfo['features']['stock_screens_per_month'] ?? 3),
        ];
    }

    private function summarizeUser(array $profile, array $tierInfo): string
    {
        $tierName = $tierInfo['name'] ?? 'Miftah';
        $tierSlug = $tierInfo['slug'] ?? 'free';

        return implode("\n", [
            '- User Name: '.$profile['name'],
            "- Detected Tier: {$tierName} ({$tierSlug})",
            '- Tier Features: '.$this->formatFeaturesSummary($tierInfo['features'] ?? []),
            '- Monthly Stock Screens Used: '.($profile['screens_limit'] === -1 ? 'unlimited' : "{$profile['screens_used']} / {$profile['screens_limit']}"),
            '- Email Verified: '.($profile['email_verified'] ? 'Yes' : 'No'),
            '- Zakat Hawl Date Set: '.($profile['hawl_date'] ?: 'Not configured yet'),
            "- Recorded Holdings ({$profile['holdings_count']}): {$profile['holdings_preview']}",
        ]);
    }

    private function summarizeGuest(array $tierInfo): string
    {
        return implode("\n", [
            "- Detected Tier: {$tierInfo['name']} ({$tierInfo['slug']})",
            '- Tier Features: General platform & AAOIFI educational FAQs only. Sign in for Miftah (Free: 3 stock screens/month, 3 holdings) or upgrade to Rawdha (Pro) / Noor (Max) for automated Zakat, purification, watchlist, baskets, statements, dividend alerts, drift tracking, and Monthly Spotlight.',
        ]);
    }

    private function formatFeaturesSummary(array $features): string
    {
        $fmtLimit = fn (string $k) => ($features[$k] ?? 0) === -1 ? 'unlimited' : (string) ($features[$k] ?? 0);
        $fmtBool = fn (string $k) => ! empty($features[$k]) ? 'yes' : 'no';

        return sprintf(
            'stock_screens/mo=%s, portfolio=%s, watchlist=%s, baskets=%s, purifications/mo=%s, zakat_calc=%s, statements=%s, dividend_alerts=%s, drift_tracking=%s, monthly_spotlight=%s',
            $fmtLimit('stock_screens_per_month'),
            $fmtLimit('portfolio_limit'),
            $fmtLimit('watchlist_limit'),
            $fmtLimit('baskets'),
            $fmtLimit('purifications_per_month'),
            $fmtBool('zakat_calc'),
            $fmtBool('statements'),
            $fmtBool('dividend_alerts'),
            $fmtBool('drift_tracking'),
            $fmtBool('monthly_spotlight')
        );
    }
}
