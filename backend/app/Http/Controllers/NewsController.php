<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\News;
use App\Models\NewsArticle;
use Illuminate\Http\Request;

class NewsController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->query('limit', 20);
        $symbol = $request->query('symbol');

        $companyId = null;
        if ($symbol) {
            $company = Company::where('symbol', $symbol)->first();
            $companyId = $company ? $company->id : -1;
        }

        $googleNewsQuery = News::with('company');
        if ($companyId !== null) {
            $googleNewsQuery->where('company_id', $companyId);
        }
        $googleNews = $googleNewsQuery->orderBy('published_at', 'desc')->limit($limit)->get();

        $marketNewsQuery = NewsArticle::with('company');
        if ($companyId !== null) {
            $marketNewsQuery->where('company_id', $companyId);
        }
        $marketNews = $marketNewsQuery->orderBy('published_at', 'desc')->limit($limit)->get();

        $combined = $googleNews->map(function ($n) {
            return [
                'id' => 'g_'.$n->id,
                'title' => $n->title,
                'url' => $n->url,
                'source' => $n->source,
                'thumbnail_url' => $n->thumbnail_url,
                'excerpt' => $n->excerpt,
                'published_at' => $n->published_at?->toIso8601String(),
                'published_human' => $n->published_at?->diffForHumans(),
                'symbol' => $n->company?->symbol,
            ];
        })->merge($marketNews->map(function ($n) {
            return [
                'id' => 'm_'.$n->id,
                'title' => $n->title,
                'url' => $n->source_url,
                'source' => $n->source,
                'thumbnail_url' => $n->image_url,
                'excerpt' => $n->content,
                'published_at' => $n->published_at?->toIso8601String(),
                'published_human' => $n->published_at?->diffForHumans(),
                'symbol' => $n->company?->symbol,
            ];
        }))->sortByDesc('published_at')->take($limit)->values();

        return response()->json([
            'status' => 'success',
            'data' => $combined,
            'meta' => [
                'current_page' => 1,
                'last_page' => 1,
                'total' => $combined->count(),
            ],
        ]);
    }
}
