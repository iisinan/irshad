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
            'alert_whatsapp' => 'sometimes|boolean',
            'alert_email' => 'sometimes|boolean',
        ]);

        $user = $request->user();

        $watchlist = Watchlist::firstOrCreate(
            [
                'user_id' => $user->id,
                'symbol' => strtoupper($request->symbol),
            ],
            [
                'alert_whatsapp' => $request->input('alert_whatsapp', false),
                'alert_email' => $request->input('alert_email', false),
            ]
        );

        // If it already existed but alerts were passed, update them.
        if (!$watchlist->wasRecentlyCreated && ($request->has('alert_whatsapp') || $request->has('alert_email'))) {
            $watchlist->update($request->only(['alert_whatsapp', 'alert_email']));
        }

        return response()->json(['message' => 'Added to watchlist', 'data' => $watchlist], 201);
    }

    public function update(Request $request, $symbol)
    {
        $request->validate([
            'alert_whatsapp' => 'sometimes|boolean',
            'alert_email' => 'sometimes|boolean',
        ]);

        $user = $request->user();

        $watchlist = Watchlist::where('user_id', $user->id)
            ->where('symbol', strtoupper($symbol))
            ->firstOrFail();

        $watchlist->update($request->only(['alert_whatsapp', 'alert_email']));

        return response()->json(['message' => 'Watchlist alerts updated', 'data' => $watchlist]);
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
