<?php

namespace App\Http\Controllers;

use App\Models\BusinessActivityUpdate;
use App\Models\Company;
use App\Models\ComplianceHistory;
use App\Models\Financial;

class PublicOverviewController extends Controller
{
    public function stats()
    {
        $stats = \Illuminate\Support\Facades\Cache::remember('public_overview_stats', 3600, function () {
            return [
                'total_companies' => Company::count(),
                'total_reports' => Financial::count(),
                'total_news' => BusinessActivityUpdate::count(),
                'halal_count' => Company::where('current_status', 'halal')->count(),
            ];
        });

        return response()->json($stats);
    }

    public function recentScreenings()
    {
        try {
            $screenings = \Illuminate\Support\Facades\Cache::remember('public_recent_screenings', 3600, function () {
                return ComplianceHistory::with('company:id,symbol,name,logo_url')
                    ->whereNotNull('new_status')
                    ->orderBy('changed_at', 'desc')
                    ->take(5)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'symbol' => $item->company ? $item->company->symbol : 'UNKNOWN',
                            'name' => $item->company ? $item->company->name : 'Unknown Company',
                            'status' => $item->new_status,
                        ];
                    });
            });

            return response()->json($screenings);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ], 500);
        }
    }

    public function latestReports()
    {
        $reports = \Illuminate\Support\Facades\Cache::remember('public_latest_reports', 3600, function () {
            return Financial::with('company:id,symbol,name,logo_url')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();
        });

        return response()->json($reports);
    }

    public function businessNews()
    {
        $news = \Illuminate\Support\Facades\Cache::remember('public_business_news', 3600, function () {
            return BusinessActivityUpdate::with('company:id,symbol,name,logo_url')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get();
        });

        return response()->json($news);
    }
}
