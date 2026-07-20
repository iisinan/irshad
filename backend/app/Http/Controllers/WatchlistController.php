<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Watchlist;
use Illuminate\Support\Facades\DB;

class WatchlistController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $watchlistItems = Watchlist::where('user_id', $user->id)->get();

        $watchlistSymbols = $watchlistItems->pluck('symbol')->map(fn($s) => strtoupper($s))->toArray();

        // 1. Fetch only the companies in the watchlist
        $companies = \App\Models\Company::whereIn('symbol', $watchlistSymbols)->get()->keyBy(fn($c) => strtoupper($c->symbol));

        // 2. Fetch the last 7 daily prices for ONLY these symbols (for sparklines)
        // Since sqlite/postgres might require complex window functions to get top N per group easily,
        // it's often faster to just query date >= 7 days ago if it's daily data, or do a simple in-memory map.
        // For 7 days, we can just grab the prices from the last 7 calendar days.
        $recentPrices = \App\Models\DailyPrice::whereIn('company_id', $companies->pluck('id'))
            ->where('date', '>=', now()->subDays(10)->toDateString())
            ->orderBy('date', 'asc')
            ->get()
            ->groupBy('company_id');

        $formatted = $watchlistItems->map(function ($item) use ($companies, $recentPrices) {
            $symbol = strtoupper($item->symbol);
            $company = $companies->get($symbol);
            
            $currentPrice = 0;
            $changePct = 0;
            $statusString = 'Doubtful';
            $historicalPrices = [];

            if ($company) {
                $currentPrice = (float) ($company->latest_price ?? 0);
                $changePct = (float) ($company->price_change_pct ?? 0);

                // Get last 7 days of prices for sparkline
                $prices = $recentPrices->get($company->id, collect());
                $historicalPrices = $prices->take(-7)->pluck('price')->map(fn($p) => (float)$p)->values()->toArray();

                if ($company->current_status) {
                    $rawStatus = strtolower($company->current_status);
                    if (in_array($rawStatus, ['halal', 'compliant'])) $statusString = 'Halal';
                    elseif (in_array($rawStatus, ['non-halal', 'non-compliant'])) $statusString = 'Non-Halal';
                }
            }

            return [
                'id' => $item->id,
                'symbol' => strtoupper($item->symbol),
                'name' => $company->name ?? $item->symbol,
                'alert_whatsapp' => $item->alert_whatsapp,
                'alert_email' => $item->alert_email,
                'price' => $currentPrice,
                'change' => round($changePct, 2),
                'status' => $statusString,
                'historical_prices' => $historicalPrices ?? [],
            ];
        });

        return response()->json($formatted);
    }

    public function store(Request $request)
    {
        $request->validate([
            'symbol'         => 'required|string',
            'alert_whatsapp' => 'sometimes|boolean',
            'alert_email'    => 'sometimes|boolean',
        ]);

        $user = $request->user();

        $watchlist = Watchlist::firstOrCreate(
            [
                'user_id' => $user->id,
                'symbol'  => strtoupper($request->symbol),
            ],
            [
                'alert_whatsapp' => $request->input('alert_whatsapp', false),
                'alert_email'    => $request->input('alert_email', false),
            ]
        );

        // If it already existed but alerts were passed, update them.
        if (!$watchlist->wasRecentlyCreated && ($request->has('alert_whatsapp') || $request->has('alert_email'))) {
            $watchlist->update($request->only(['alert_whatsapp', 'alert_email']));
        }

        return response()->json(['message' => 'Added to watchlist', 'data' => $watchlist], 201);
    }

    /**
     * Bulk-insert multiple symbols in a single DB transaction.
     * Body: { symbols: ['GTCO','UBA'], alert_email: true, alert_whatsapp: false }
     */
    public function bulkStore(Request $request)
    {
        $request->validate([
            'symbols'        => 'required|array|min:1',
            'symbols.*'      => 'required|string',
            'alert_whatsapp' => 'sometimes|boolean',
            'alert_email'    => 'sometimes|boolean',
        ]);

        $user          = $request->user();
        $alertEmail    = $request->boolean('alert_email', false);
        $alertWhatsapp = $request->boolean('alert_whatsapp', false);
        $now           = now();

        $rows = collect($request->symbols)->map(fn($sym) => [
            'user_id'        => $user->id,
            'symbol'         => strtoupper($sym),
            'alert_email'    => $alertEmail,
            'alert_whatsapp' => $alertWhatsapp,
            'created_at'     => $now,
            'updated_at'     => $now,
        ])->toArray();

        Watchlist::upsert(
            $rows,
            ['user_id', 'symbol'],
            ['alert_email', 'alert_whatsapp', 'updated_at']
        );

        $watchlist = Watchlist::where('user_id', $user->id)
            ->whereIn('symbol', collect($rows)->pluck('symbol'))
            ->get();

        return response()->json(['message' => 'Watchlist updated', 'data' => $watchlist], 201);
    }

    /**
     * Onboard: one atomic request that bulk-saves the watchlist AND marks user as onboarded.
     * Replaces N × addToWatchlist() + updateProfile() with a single round-trip.
     * Body: { symbols: [...], alert_email: bool, alert_whatsapp: bool }
     */
    public function onboard(Request $request)
    {
        $request->validate([
            'symbols'        => 'required|array|min:1',
            'symbols.*'      => 'required|string',
            'alert_whatsapp' => 'sometimes|boolean',
            'alert_email'    => 'sometimes|boolean',
            'phone_number'   => 'sometimes|string|nullable|max:20',
            'risk_profile'   => 'sometimes|string|in:conservative,moderate,aggressive',
        ]);

        $user          = $request->user();
        $alertEmail    = $request->boolean('alert_email', false);
        $alertWhatsapp = $request->boolean('alert_whatsapp', false);
        $phoneNumber   = $request->input('phone_number');
        $riskProfile   = $request->input('risk_profile', 'moderate');
        $now           = now();

        $rows = collect($request->symbols)->map(fn($sym) => [
            'user_id'        => $user->id,
            'symbol'         => strtoupper($sym),
            'alert_email'    => $alertEmail,
            'alert_whatsapp' => $alertWhatsapp,
            'created_at'     => $now,
            'updated_at'     => $now,
        ])->toArray();

        DB::transaction(function () use ($user, $rows, $alertWhatsapp, $phoneNumber, $riskProfile) {
            // 1. Bulk-upsert watchlist (single INSERT ... ON CONFLICT DO UPDATE)
            Watchlist::upsert(
                $rows,
                ['user_id', 'symbol'],
                ['alert_email', 'alert_whatsapp', 'updated_at']
            );

            // 2. Mark the user as onboarded inside the same transaction
            $prefs = $user->preferences ?? [];
            $prefs['onboarded'] = true;
            $prefs['risk_profile'] = $riskProfile;
            
            $updates = ['preferences' => $prefs];
            if ($alertWhatsapp && $phoneNumber) {
                $updates['phone_number'] = $phoneNumber;
            }
            $user->update($updates);
        });

        $user->refresh();

        return response()->json([
            'message' => 'Onboarding complete',
            'user'    => $user,
        ], 201);
    }

    public function update(Request $request, $symbol)
    {
        $request->validate([
            'alert_whatsapp' => 'sometimes|boolean',
            'alert_email'    => 'sometimes|boolean',
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
