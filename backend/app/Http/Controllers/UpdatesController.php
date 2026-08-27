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
    public function newsAndInsights(Request $request): JsonResponse
    {
        $data = \Illuminate\Support\Facades\Cache::remember('updates_news_insights', now()->addHours(1), function () {
            // 1. Compliance Status Changes
            $complianceChanges = ComplianceStatusChange::with('company:id,symbol,name,logo_url')
                ->orderBy('updated_at_change', 'desc')
                ->limit(20)
                ->get()
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
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    public function digestPreference(Request $request): JsonResponse
    {
        $pref = WeeklyDigestPreference::firstOrCreate(
            ['user_id' => auth()->id()],
            ['email_enabled' => false, 'in_app_enabled' => true, 'frequency' => 'weekly']
        );

        return response()->json(['data' => $pref]);
    }

    public function updateDigestPreference(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email_enabled' => 'boolean',
            'in_app_enabled' => 'boolean',
            'frequency' => 'in:weekly,monthly',
        ]);

        $pref = WeeklyDigestPreference::updateOrCreate(
            ['user_id' => auth()->id()],
            $validated
        );

        return response()->json(['data' => $pref, 'message' => 'Digest preferences saved']);
    }
}
