<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Company;
use App\Models\Financial;
use App\Models\BusinessActivityUpdate;
use App\Models\ComplianceHistory;

class PublicOverviewController extends Controller
{
    public function stats()
    {
        $companies = Company::count();
        $reports = Financial::count();
        $news = BusinessActivityUpdate::count();
        $halal = Company::where('current_status', 'halal')->count();

        return response()->json([
            'total_companies' => $companies,
            'total_reports' => $reports,
            'total_news' => $news,
            'halal_count' => $halal,
        ]);
    }

    public function recentScreenings()
    {
        $screenings = ComplianceHistory::with('company:id,symbol,name,logo_url')
            ->whereNotNull('new_status')
            ->orderBy('reviewed_at', 'desc')
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
            
        return response()->json($screenings);
    }

    public function latestReports()
    {
        $reports = Financial::with('company:id,symbol,name,logo_url')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();
            
        return response()->json($reports);
    }

    public function businessNews()
    {
        $news = BusinessActivityUpdate::with('company:id,symbol,name,logo_url')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();
            
        return response()->json($news);
    }
}
