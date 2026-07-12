<?php

namespace App\Http\Controllers;

use App\Models\News;
use App\Http\Resources\NewsResource;
use Illuminate\Http\Request;

class NewsController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->query('limit', 20);
        $symbol = $request->query('symbol');

        $query = News::orderBy('published_at', 'desc');

        if ($symbol) {
            $query->where(function ($q) use ($symbol) {
                $q->where('title', 'LIKE', '%' . $symbol . '%')
                  ->orWhere('excerpt', 'LIKE', '%' . $symbol . '%');
            });
        }

        $news = $query->paginate($limit);

        return response()->json([
            'status' => 'success',
            'data' => NewsResource::collection($news),
            'meta' => [
                'current_page' => $news->currentPage(),
                'last_page' => $news->lastPage(),
                'total' => $news->total(),
            ]
        ]);
    }
}
