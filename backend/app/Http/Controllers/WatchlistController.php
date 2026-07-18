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
        $watchlistItems = Watchlist::with(['company.status', 'company.dailyPrices' => function($q) {
                $q->latest('date')->take(2);
            }])
            ->where('user_id', $user->id)
            ->get();

        $formatted = $watchlistItems->map(function ($item) {
            $company = $item->company;
            $prices = $company?->dailyPrices;
            $currentPrice = 0;
            $changePct = 0;

            if ($prices && $prices->count() > 0) {
                $currentPrice = $prices->first()->price;
                if ($prices->count() > 1) {
                    $prevPrice = $prices->last()->price;
                    if ($prevPrice > 0) {
                        $changePct = (($currentPrice - $prevPrice) / $prevPrice) * 100;
                    }
                }
            }

            $statusString = 'Doubtful';
            if ($company?->status?->status) {
                $rawStatus = strtolower($company->status->status);
                if ($rawStatus === 'halal' || $rawStatus === 'compliant') $statusString = 'Halal';
                elseif ($rawStatus === 'non-halal' || $rawStatus === 'non-compliant') $statusString = 'Non-Halal';
            }

            return [
                'id' => $item->id,
                'symbol' => $item->symbol,
                'name' => $company->name ?? $item->symbol,
                'alert_whatsapp' => $item->alert_whatsapp,
                'alert_email' => $item->alert_email,
                'price' => $currentPrice,
                'change' => round($changePct, 2),
                'status' => $statusString,
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
