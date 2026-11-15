<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Holding;
use App\Models\Resource;
use App\Models\User;
use Illuminate\Support\Collection;

class ChatbotContextService
{
    /**
     * Gather grounded database & knowledge-base context for the user's message.
     *
     * @return array{
     *   prompt_context: string,
     *   matched_companies: array<int, array<string, mixed>>,
     *   matched_resources: array<int, array<string, mixed>>,
     *   kb_sections: array<int, string>
     * }
     */
    public function build(User $user, string $message): array
    {
        return $this->formatContextBundle($user, $message);
    }

    /**
     * Gather public-only KB, stock compliance, and educational resource context for unauthenticated visitors.
     */
    public function buildPublic(string $message): array
    {
        return $this->formatContextBundle(null, $message);
    }

    private function formatContextBundle(?User $user, string $message): array
    {
        $companies = $this->findRelevantCompanies($message);
        $resources = $this->findRelevantResources($message);
        $kbSections = $this->matchKnowledgeBase($message);
        $userSummary = $user
            ? $this->summarizeUser($user)
            : 'Public website visitor (not signed in). Do not assume account details; encourage creating a free account or signing in to manage holdings, Hawl dates, and full screenings.';

        $blocks = [];

        if (! empty($kbSections)) {
            $blocks[] = "=== IRSHAD PLATFORM KNOWLEDGE BASE ===\n".implode("\n\n", array_map(
                fn (array $section) => "**{$section['title']}**\n{$section['content']}",
                $kbSections
            ));
        }

        $blocks[] = ($user ? '=== CURRENT USER CONTEXT (AUTHENTICATED) ===' : '=== VISITOR CONTEXT (PUBLIC) ===')."\n".$userSummary;

        if ($companies->isNotEmpty()) {
            $companyLines = $companies->map(function (Company $company) {
                $status = $company->status?->status ?? $company->current_status ?? 'unscreened';
                $verified = $company->status?->verified_by_scholar ? 'Yes' : 'No';
                $screening = $company->aaoifiScreening;

                $line = "- {$company->name} ({$company->symbol}) | Sector: ".($company->sector ?: 'N/A')
                    ." | Compliance Status: {$status} | Scholar Verified: {$verified}";

                if ($company->latest_price !== null) {
                    $line .= ' | Latest Price: NGN '.number_format((float) $company->latest_price, 2);
                }

                if ($screening) {
                    $line .= sprintf(
                        ' | AAOIFI Business: %s | Debt Ratio: %.2f%% (<30%% limit) | Cash Ratio: %.2f%% (<30%% limit) | Impermissible Income: %.2f%% (<5%% limit) | Final Screening: %s',
                        $screening->business_status ?? 'N/A',
                        (float) ($screening->debt_ratio ?? 0),
                        (float) ($screening->cash_ratio ?? 0),
                        (float) ($screening->impermissible_income_ratio ?? 0),
                        $screening->final_status ?? $status
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
                fn (Resource $r) => "- [{$r->type}] {$r->title}".($r->scholar ? " by {$r->scholar}" : '').($r->category ? " ({$r->category})" : '')
            )->implode("\n");

            $blocks[] = "=== MATCHED EDUCATIONAL RESOURCES ===\n".$resourceLines;
        }

        return [
            'prompt_context' => implode("\n\n", $blocks),
            'matched_companies' => $companies->map(fn (Company $c) => [
                'symbol' => $c->symbol,
                'name' => $c->name,
                'status' => $c->status?->status ?? $c->current_status ?? 'unknown',
            ])->values()->all(),
            'matched_resources' => $resources->map(fn (Resource $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'type' => $r->type,
                'scholar' => $r->scholar,
                'category' => $r->category,
            ])->values()->all(),
            'kb_sections' => array_column($kbSections, 'title'),
        ];
    }

    /**
     * Find up to 3 companies matching symbols or significant words in the user's message.
     */
    private function findRelevantCompanies(string $message): Collection
    {
        preg_match_all('/\b[A-Za-z][A-Za-z0-9]{1,11}\b/', $message, $matches);
        $rawTokens = $matches[0] ?? [];

        $stopWords = [
            'HALAL', 'HARAM', 'IS', 'ARE', 'THE', 'AND', 'FOR', 'WHAT', 'HOW', 'CAN', 'YOU',
            'ABOUT', 'TELL', 'CHECK', 'STATUS', 'STOCK', 'STOCKS', 'AAOIFI', 'ZAKAT', 'HAWL',
            'MY', 'DO', 'DOES', 'WHY', 'WITH', 'THIS', 'THAT', 'FROM', 'HAVE', 'PLS', 'PLEASE',
            'IRSHAD', 'PLAN', 'PRICING', 'HELP', 'NGX', 'BUY', 'SELL', 'PURIFY', 'PURIFICATION',
            'DIVIDEND', 'DATE', 'DEBT', 'CASH', 'RATIO', 'COMPLIANT', 'SUPPORT', 'HUMAN', 'ADMIN',
        ];

        $symbolCandidates = [];
        $nameTokens = [];

        foreach ($rawTokens as $token) {
            $upper = strtoupper($token);
            if (in_array($upper, $stopWords, true)) {
                continue;
            }

            if (strlen($upper) >= 2 && strlen($upper) <= 12) {
                $symbolCandidates[] = $upper;
            }
            if (strlen($token) >= 4) {
                $nameTokens[] = strtolower($token);
            }
        }

        $found = collect();

        if (! empty($symbolCandidates)) {
            $bySymbol = Company::with(['status:id,company_id,status,verified_by_scholar', 'aaoifiScreening'])
                ->select(['id', 'name', 'symbol', 'sector', 'current_status', 'latest_price', 'activity_reason'])
                ->whereIn('symbol', array_values(array_unique($symbolCandidates)))
                ->limit(3)
                ->get();
            $found = $found->merge($bySymbol);
        }

        if ($found->count() < 3 && ! empty($nameTokens)) {
            $remaining = 3 - $found->count();
            $existingIds = $found->pluck('id')->all();

            $byName = Company::with(['status:id,company_id,status,verified_by_scholar', 'aaoifiScreening'])
                ->select(['id', 'name', 'symbol', 'sector', 'current_status', 'latest_price', 'activity_reason'])
                ->when(! empty($existingIds), fn ($q) => $q->whereNotIn('id', $existingIds))
                ->where(function ($q) use ($nameTokens) {
                    foreach (array_slice(array_unique($nameTokens), 0, 5) as $word) {
                        $q->orWhereRaw('LOWER(name) LIKE ?', ['%'.$word.'%']);
                    }
                })
                ->limit($remaining)
                ->get();

            $found = $found->merge($byName);
        }

        return $found->take(3)->values();
    }

    /**
     * Find up to 3 educational resources relevant to keywords in the message.
     */
    private function findRelevantResources(string $message): Collection
    {
        preg_match_all('/\b[A-Za-z]{4,}\b/', strtolower($message), $matches);
        $words = array_values(array_diff(array_unique($matches[0] ?? []), [
            'what', 'when', 'where', 'which', 'this', 'that', 'with', 'from', 'have',
            'about', 'please', 'could', 'would', 'should', 'explain', 'irshad', 'help',
        ]));

        if (empty($words)) {
            return collect();
        }

        return Resource::query()
            ->where(function ($q) use ($words) {
                foreach (array_slice($words, 0, 5) as $word) {
                    $q->orWhereRaw('LOWER(title) LIKE ?', ['%'.$word.'%'])
                        ->orWhereRaw('LOWER(category) LIKE ?', ['%'.$word.'%']);
                }
            })
            ->latest()
            ->limit(3)
            ->get();
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
