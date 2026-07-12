<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Watchlist;
use Illuminate\Support\Facades\Log;

class WatchlistController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        // Return watchlist with enriched stock data (this could be optimized via a DB join if stocks were stored locally,
        // but for now we just return the symbols. We will enrich in frontend or here via StockController logic).
        $watchlist = Watchlist::where('user_id', $user->id)->get();
        return response()->json($watchlist);
    }

    public function store(Request $request)
    {
        $request->validate([
            'symbol' => 'required|string',
        ]);

        $user = $request->user();

        $watchlist = Watchlist::firstOrCreate([
            'user_id' => $user->id,
            'symbol' => strtoupper($request->symbol),
        ]);

        return response()->json(['message' => 'Added to watchlist', 'data' => $watchlist], 201);
    }

    public function destroy(Request $request, $symbol)
    {
        $user = $request->user();

        $deleted = Watchlist::where('user_id', $user->id)
                            ->where('symbol', strtoupper($symbol))
                            ->delete();

        if ($deleted) {
            return response()->json(['message' => 'Removed from watchlist']);
        }

        return response()->json(['message' => 'Item not found'], 404);
    }
}
