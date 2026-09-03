<?php

namespace App\Console\Commands;

use App\Models\BusinessActivityUpdate;
use App\Models\Company;
use App\Models\NewsArticle;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * ReassignNewsCompanies
 *
 * One-time / on-demand cleanup: re-evaluates company_id for every
 * row in news_articles and business_activity_updates using the strict
 * matching rules introduced in ScrapeMarketNews (Sep 2026).
 *
 * Rows that cannot be confidently matched to any company have their
 * company_id set to NULL (they still appear in the global news feed
 * but are no longer wrongly pinned to a specific ticker).
 *
 * Usage:  php artisan news:reassign-companies [--delete-unmatched]
 */
class ReassignNewsCompanies extends Command
{
    protected $signature   = 'news:reassign-companies {--delete-unmatched : Delete records that cannot be matched instead of nullifying}';
    protected $description = 'Re-evaluate and fix company_id on existing news_articles and business_activity_updates using strict matching rules.';

    /** Generic noise words — too common to count as a reliable company signal */
    private array $skipWords = [
        'nigerian', 'nigeria', 'national', 'group', 'plc', 'limited', 'ltd',
        'company', 'co', 'industries', 'holdings', 'international', 'africa',
        'west', 'east', 'first', 'united', 'global', 'new', 'trans',
    ];

    public function handle(): void
    {
        $deleteUnmatched = $this->option('delete-unmatched');
        $companies       = Company::all();

        $this->info('=== ReassignNewsCompanies ===');
        $this->info("Loaded {$companies->count()} companies.");
        $this->info($deleteUnmatched ? 'Mode: DELETE unmatched rows' : 'Mode: NULLIFY company_id on unmatched rows');

        // ── 1. news_articles ──────────────────────────────────────────────
        $this->info("\n[1/2] Processing news_articles...");
        $totalNews    = 0;
        $fixedNews    = 0;
        $nullifiedNews = 0;
        $deletedNews  = 0;

        NewsArticle::chunkById(200, function ($articles) use (
            $companies, $deleteUnmatched,
            &$totalNews, &$fixedNews, &$nullifiedNews, &$deletedNews
        ) {
            foreach ($articles as $article) {
                $totalNews++;
                $text          = strtolower($article->title . ' ' . ($article->content ?? ''));
                $correctId     = $this->matchCompany($text, $companies);

                if ($correctId === $article->company_id) {
                    continue; // already correct — no change needed
                }

                if ($correctId !== null) {
                    $article->update(['company_id' => $correctId]);
                    $fixedNews++;
                } else {
                    if ($deleteUnmatched) {
                        $article->delete();
                        $deletedNews++;
                    } else {
                        $article->update(['company_id' => null]);
                        $nullifiedNews++;
                    }
                }
            }
        });

        $this->info("  news_articles  → checked: {$totalNews}, re-assigned: {$fixedNews}, nullified: {$nullifiedNews}, deleted: {$deletedNews}");

        // ── 2. business_activity_updates ─────────────────────────────────
        $this->info("\n[2/2] Processing business_activity_updates...");
        $totalBiz    = 0;
        $fixedBiz    = 0;
        $nullifiedBiz = 0;
        $deletedBiz  = 0;

        BusinessActivityUpdate::chunkById(200, function ($updates) use (
            $companies, $deleteUnmatched,
            &$totalBiz, &$fixedBiz, &$nullifiedBiz, &$deletedBiz
        ) {
            foreach ($updates as $update) {
                $totalBiz++;
                $text      = strtolower($update->summary . ' ' . ($update->source ?? ''));
                $correctId = $this->matchCompany($text, $companies);

                if ($correctId === $update->company_id) {
                    continue;
                }

                if ($correctId !== null) {
                    $update->update(['company_id' => $correctId]);
                    $fixedBiz++;
                } else {
                    if ($deleteUnmatched) {
                        $update->delete();
                        $deletedBiz++;
                    } else {
                        $update->update(['company_id' => null]);
                        $nullifiedBiz++;
                    }
                }
            }
        });

        $this->info("  business_activity_updates → checked: {$totalBiz}, re-assigned: {$fixedBiz}, nullified: {$nullifiedBiz}, deleted: {$deletedBiz}");

        // ── Bust cache so frontend sees fresh data immediately ────────────
        Cache::forget('updates_news_insights');

        $this->info("\n✅ Done. Cache cleared.");
    }

    /**
     * Apply the same strict matching rules as the fixed ScrapeMarketNews command.
     *
     * Returns company_id (int) on a confident match, or null if no match.
     */
    private function matchCompany(string $text, $companies): ?int
    {
        foreach ($companies as $comp) {
            // 1. Symbol as a whole word (≥3 chars to avoid false 2-letter matches)
            $symbol = strtolower($comp->symbol);
            if (strlen($symbol) >= 3) {
                $pattern = '/\b' . preg_quote($symbol, '/') . '\b/';
                if (preg_match($pattern, $text)) {
                    return $comp->id;
                }
            }

            // 2. Multi-word name matching
            $nameParts = array_values(array_filter(
                explode(' ', strtolower($comp->name)),
                fn ($w) => strlen($w) >= 4 && !in_array($w, $this->skipWords)
            ));

            if (count($nameParts) >= 2) {
                $matched = 0;
                foreach ($nameParts as $part) {
                    if (preg_match('/\b' . preg_quote($part, '/') . '\b/', $text)) {
                        $matched++;
                    }
                }
                if ($matched >= 2) {
                    return $comp->id;
                }
            } elseif (count($nameParts) === 1 && strlen($nameParts[0]) >= 6) {
                if (preg_match('/\b' . preg_quote($nameParts[0], '/') . '\b/', $text)) {
                    return $comp->id;
                }
            }
        }

        return null;
    }
}
