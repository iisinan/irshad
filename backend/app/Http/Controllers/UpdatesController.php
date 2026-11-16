<?php

namespace App\Http\Controllers;

use App\Models\BusinessActivityUpdate;
use App\Models\ComplianceStatusChange;
use App\Models\NewsArticle;
use App\Models\WeeklyDigestPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UpdatesController extends Controller
{
    public static function normalizeStatus(?string $status): string
    {
        if (! $status) {
            return 'unknown';
        }
        $s = strtolower(trim(str_replace(['_', ' '], '-', $status)));
        if (in_array($s, ['halal', 'compliant', 'pass', 'shariah-compliant'])) {
            return 'halal';
        }
        if (in_array($s, ['non-compliant', 'non-halal', 'fail', 'shariah-non-compliant', 'haram'])) {
            return 'non_compliant';
        }
        if (in_array($s, ['doubtful', 'questionable'])) {
            return 'doubtful';
        }

        return $s;
    }

    public function newsAndInsights(Request $request): JsonResponse
    {
        $data = \Illuminate\Support\Facades\Cache::remember('updates_news_insights_v2', now()->addHours(1), function () {
            // 1. Compliance Status Changes (strictly filter out stocks that move from/to the same compliance category)
            $complianceChanges = ComplianceStatusChange::with('company:id,symbol,name,logo_url')
                ->whereNotNull('previous_status')
                ->where('previous_status', '!=', '')
                ->where('previous_status', '!=', 'unknown')
                ->whereColumn('previous_status', '!=', 'new_status')
                ->orderBy('updated_at_change', 'desc')
                ->get()
                ->filter(function ($c) {
                    $prev = self::normalizeStatus($c->previous_status);
                    $new = self::normalizeStatus($c->new_status);
                    return $prev !== 'unknown' && $new !== 'unknown' && $prev !== $new;
                })
                ->unique('company_id')
                ->take(20)
                ->values()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'symbol' => $c->company?->symbol,
                    'name' => $c->company?->name,
                    'logo_url' => $c->company?->logo_url,
                    'previous_status' => $c->previous_status,
                    'new_status' => $c->new_status,
                    'reason' => $c->reason,
                    'report_url' => $c->report_url,
                    'updated_at' => $c->updated_at_change,
                    'time_ago' => $c->updated_at_change?->diffForHumans(),
                ]);

            // 2. Business Activity Updates
            $businessUpdates = BusinessActivityUpdate::with('company:id,symbol,name,logo_url')
                ->orderBy('date_detected', 'desc')
                ->limit(20)
                ->get()
                ->map(fn ($b) => [
                    'id' => $b->id,
                    'symbol' => $b->company?->symbol,
                    'name' => $b->company?->name,
                    'logo_url' => $b->company?->logo_url,
                    'activity_type' => $b->activity_type,
                    'activity_label' => $b->activity_type_label,
                    'summary' => $b->summary,
                    'source' => $b->source,
                    'source_url' => $b->source_url,
                    'date_detected' => $b->date_detected,
                    'time_ago' => $b->date_detected?->diffForHumans(),
                ]);

            $mapNews = fn ($n) => [
                'id' => $n->id,
                'symbol' => $n->company?->symbol,
                'name' => $n->company?->name,
                'title' => $n->title,
                'category' => $n->category,
                'content' => $n->content,
                'source' => $n->source,
                'source_url' => $n->source_url,
                'image_url' => $n->image_url,
                'published_at' => $n->published_at,
                'time_ago' => $n->published_at?->diffForHumans(),
            ];

            // 3. Market Intelligence
            $marketIntelligence = NewsArticle::with('company:id,symbol,name')
                ->where('category', 'market_intelligence')
                ->orderBy('published_at', 'desc')
                ->limit(15)
                ->get()
                ->map($mapNews);

            // 4. Dividends
            $dividends = NewsArticle::with('company:id,symbol,name')
                ->where('category', 'dividend')
                ->orderBy('published_at', 'desc')
                ->limit(10)
                ->get()
                ->map($mapNews);

            // 5. Analysis (earnings, screening, aaoifi)
            $analysis = NewsArticle::with('company:id,symbol,name')
                ->whereIn('category', ['earnings', 'screening', 'aaoifi'])
                ->orderBy('published_at', 'desc')
                ->limit(10)
                ->get()
                ->map($mapNews);

            return [
                'compliance_changes' => $complianceChanges,
                'business_updates' => $businessUpdates,
                'market_intelligence' => $marketIntelligence,
                'dividends' => $dividends,
                'analysis' => $analysis,
                'sector_breakdown' => $this->buildSectorBreakdown(),
            ];
        });

        $user = $request->user();
        $dividendAlertsAllowed = $user ? \App\Services\SubscriptionService::canUseFeature($user, 'dividend_alerts') : false;
        $driftTrackingAllowed = $user ? \App\Services\SubscriptionService::canUseFeature($user, 'drift_tracking') : false;
        $monthlySpotlightAllowed = $user ? \App\Services\SubscriptionService::canUseFeature($user, 'monthly_spotlight') : false;

        $responsePayload = $data;
        if (!$dividendAlertsAllowed) {
            $responsePayload['dividends'] = [];
        }
        if (!$driftTrackingAllowed) {
            $responsePayload['compliance_changes'] = [];
        }
        if (!$driftTrackingAllowed && !$monthlySpotlightAllowed) {
            $responsePayload['sector_breakdown'] = [];
        }
        $responsePayload['tier_locks'] = [
            'dividend_alerts_locked' => !$dividendAlertsAllowed,
            'drift_tracking_locked' => !$driftTrackingAllowed,
            'monthly_spotlight_locked' => !$monthlySpotlightAllowed,
        ];

        return response()->json([
            'data' => $responsePayload,
        ]);
    }

    /**
     * Monthly Spotlight — Full insights (Exclusive to Noor / Max tier).
     */
    public function monthlySpotlight(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !\App\Services\SubscriptionService::canUseFeature($user, 'monthly_spotlight')) {
            return response()->json([
                'error' => 'Upgrade Required',
                'upgrade_required' => true,
                'feature' => 'monthly_spotlight',
                'required_tier' => 'max',
                'message' => 'Monthly Spotlight full insights are exclusive to the Noor (Max) plan.',
            ], 403);
        }

        $spotlight = \Illuminate\Support\Facades\Cache::remember('updates_monthly_spotlight', now()->addHours(2), function () {
            $halalCompanies = \App\Models\Company::with(['aaoifiScreening', 'latestDividend'])
                ->where(function ($q) {
                    $q->whereIn('current_status', ['halal', 'compliant'])
                      ->orWhereHas('status', fn ($sq) => $sq->whereIn('status', ['halal', 'compliant']));
                })
                ->get();

            $topGainers = $halalCompanies
                ->whereNotNull('price_change_pct')
                ->sortByDesc('price_change_pct')
                ->take(5)
                ->values()
                ->map(fn ($c) => [
                    'symbol' => $c->symbol,
                    'name' => $c->name,
                    'sector' => $c->sector ?? 'Equities',
                    'latest_price' => (float) ($c->latest_price ?? 0),
                    'price_change_pct' => round((float) ($c->price_change_pct ?? 0), 2),
                    'logo_url' => $c->logo_url,
                ]);

            $ratioLeaders = $halalCompanies
                ->filter(fn ($c) => $c->aaoifiScreening !== null)
                ->sortBy(fn ($c) => ((float) ($c->aaoifiScreening->debt_ratio ?? 0)) + ((float) ($c->aaoifiScreening->impermissible_income_ratio ?? 0)))
                ->take(5)
                ->values()
                ->map(fn ($c) => [
                    'symbol' => $c->symbol,
                    'name' => $c->name,
                    'sector' => $c->sector ?? 'Equities',
                    'debt_ratio' => round((float) ($c->aaoifiScreening->debt_ratio ?? 0), 2),
                    'cash_ratio' => round((float) ($c->aaoifiScreening->cash_ratio ?? 0), 2),
                    'impure_income_ratio' => round((float) ($c->aaoifiScreening->impermissible_income_ratio ?? 0), 2),
                    'logo_url' => $c->logo_url,
                ]);

            $dividendLeaders = $halalCompanies
                ->filter(fn ($c) => $c->latestDividend && (float) ($c->latestDividend->amount ?? 0) > 0)
                ->sortByDesc(fn ($c) => (float) ($c->latestDividend->amount ?? 0))
                ->take(5)
                ->values()
                ->map(fn ($c) => [
                    'symbol' => $c->symbol,
                    'name' => $c->name,
                    'sector' => $c->sector ?? 'Equities',
                    'dividend_amount' => (float) ($c->latestDividend->amount ?? 0),
                    'pay_date' => $c->latestDividend->pay_date,
                    'latest_price' => (float) ($c->latest_price ?? 0),
                ]);

            $sectorBreakdown = $this->buildSectorBreakdown();

            $spotlightArticles = NewsArticle::with('company:id,symbol,name')
                ->whereIn('category', ['market_intelligence', 'aaoifi', 'earnings'])
                ->orderBy('published_at', 'desc')
                ->limit(6)
                ->get()
                ->map(fn ($n) => [
                    'id' => $n->id,
                    'symbol' => $n->company?->symbol,
                    'name' => $n->company?->name,
                    'title' => $n->title,
                    'category' => $n->category,
                    'content' => $n->content,
                    'source' => $n->source,
                    'source_url' => $n->source_url,
                    'published_at' => $n->published_at,
                    'time_ago' => $n->published_at?->diffForHumans(),
                ]);

            return [
                'month' => now()->format('F Y'),
                'top_halal_gainers' => $topGainers,
                'ratio_health_leaders' => $ratioLeaders,
                'dividend_yield_leaders' => $dividendLeaders,
                'sector_breakdown' => $sectorBreakdown,
                'spotlight_articles' => $spotlightArticles,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $spotlight,
        ]);
    }

    public function digestPreference(Request $request): JsonResponse
    {
        $pref = WeeklyDigestPreference::firstOrCreate(
            ['user_id' => auth()->id()],
            ['email_enabled' => false, 'push_enabled' => false, 'in_app_enabled' => true, 'frequency' => 'weekly']
        );

        return response()->json(['data' => $pref]);
    }

    public function updateDigestPreference(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email_enabled' => 'boolean',
            'push_enabled' => 'boolean',
            'in_app_enabled' => 'boolean',
            'frequency' => 'in:weekly,monthly',
        ]);

        $user = $request->user();
        if (($validated['frequency'] ?? null) === 'monthly' && $user && !\App\Services\SubscriptionService::canUseFeature($user, 'monthly_spotlight')) {
            return response()->json([
                'error' => 'Upgrade Required',
                'upgrade_required' => true,
                'feature' => 'monthly_spotlight',
                'required_tier' => 'max',
                'message' => 'Monthly Spotlight digest is exclusive to the Noor (Max) plan.',
            ], 403);
        }

        $pref = WeeklyDigestPreference::updateOrCreate(
            ['user_id' => auth()->id()],
            $validated
        );

        return response()->json(['data' => $pref, 'message' => 'Digest preferences saved']);
    }

    /**
     * Build per-sector Halal compliance breakdown across all active companies.
     */
    private function buildSectorBreakdown(): array
    {
        $allCompanies = \App\Models\Company::select(['id', 'sector', 'current_status'])->get();

        return $allCompanies
            ->groupBy(fn ($c) => $c->sector ?: 'Other')
            ->map(function ($group, $sector) {
                $total = $group->count();
                $halal = $group->filter(
                    fn ($c) => in_array(strtolower((string) $c->current_status), ['halal', 'compliant'])
                )->count();

                return [
                    'sector' => $sector,
                    'total_companies' => $total,
                    'halal_companies' => $halal,
                    'compliance_rate' => $total > 0 ? round(($halal / $total) * 100, 1) : 0,
                ];
            })
            ->sortByDesc('halal_companies')
            ->take(6)
            ->values()
            ->all();
    }
}
