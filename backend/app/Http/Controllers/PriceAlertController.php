<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\PriceAlert;
use App\Models\Watchlist;
use Illuminate\Http\Request;

class PriceAlertController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user() ?? auth()->user();
        if (!$user) {
            return response()->json(['data' => [], 'alerts' => []]);
        }

        // 1. Price Alerts
        $priceAlerts = $user->priceAlerts()->with('company')->get()->map(function ($alert) {
            return [
                'id' => $alert->id,
                'symbol' => $alert->company?->symbol ?? 'UNKNOWN',
                'type' => 'Price',
                'target_price' => (float) $alert->target_price,
                'value' => (float) $alert->target_price,
                'condition' => ucfirst($alert->condition ?? 'Target'),
                'is_active' => (bool) $alert->is_active,
                'active' => (bool) $alert->is_active,
                'created_at' => $alert->created_at,
            ];
        });

        // 2. Watchlist Alerts (AAOIFI compliance, verdict changes, price movement)
        $watchlistAlerts = Watchlist::where('user_id', $user->id)
            ->where(function ($q) {
                $q->where('alert_verdict_change', true)
                  ->orWhere('alert_compliance_risk', true)
                  ->orWhere('alert_price_change', true);
            })
            ->get()
            ->map(function ($item) {
                $conditions = [];
                if ($item->alert_verdict_change) $conditions[] = 'Status Change';
                if ($item->alert_compliance_risk) $conditions[] = 'Compliance Risk';
                if ($item->alert_price_change) $conditions[] = 'Price Movement';

                return [
                    'id' => 100000 + $item->id,
                    'watchlist_id' => $item->id,
                    'symbol' => strtoupper($item->symbol),
                    'type' => 'Compliance',
                    'target_price' => null,
                    'value' => null,
                    'condition' => implode(', ', $conditions),
                    'is_active' => (bool) $item->alert_inapp,
                    'active' => (bool) $item->alert_inapp,
                    'created_at' => $item->created_at,
                ];
            });

        $allAlerts = $priceAlerts->concat($watchlistAlerts)->values();

        return response()->json([
            'data' => $allAlerts,
            'alerts' => $allAlerts,
        ]);
    }

    public function store(Request $request, $symbol)
    {
        $request->validate([
            'target_price' => 'required|numeric|min:0.01',
        ]);

        $company = Company::where('symbol', strtoupper($symbol))->firstOrFail();

        // Find latest price to determine condition automatically
        $latestPrice = $company->dailyPrices()->latest('date')->first();
        if (! $latestPrice) {
            return response()->json(['message' => 'No price data available for this stock to set an alert.'], 400);
        }

        $currentPrice = (float) $latestPrice->price;
        $targetPrice = (float) $request->target_price;

        $condition = $targetPrice > $currentPrice ? 'above' : 'below';

        $user = $request->user() ?? auth()->user();

        // Update existing active alert or create new one
        $alert = PriceAlert::updateOrCreate(
            [
                'user_id' => $user->id,
                'company_id' => $company->id,
            ],
            [
                'target_price' => $targetPrice,
                'condition' => $condition,
                'is_active' => true,
            ]
        );

        return response()->json([
            'message' => "Price alert set! You will be notified when {$symbol} goes {$condition} ₦{$targetPrice}.",
            'data' => $alert,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user() ?? auth()->user();
        $intId = (int) $id;
        $isActive = $request->boolean('active', $request->boolean('is_active', true));

        if ($intId >= 100000) {
            $watchlistId = $intId - 100000;
            $wl = Watchlist::where('user_id', $user->id)->where('id', $watchlistId)->firstOrFail();
            $wl->update(['alert_inapp' => $isActive, 'alert_push' => $isActive]);
            return response()->json(['message' => 'Watchlist alert updated', 'data' => $wl]);
        }

        $alert = PriceAlert::where('user_id', $user->id)->where('id', $id)->firstOrFail();
        $alert->update(['is_active' => $isActive]);

        return response()->json(['message' => 'Alert updated successfully', 'data' => $alert]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user() ?? auth()->user();
        $intId = (int) $id;

        if ($intId >= 100000) {
            $watchlistId = $intId - 100000;
            $wl = Watchlist::where('user_id', $user->id)->where('id', $watchlistId)->firstOrFail();
            $wl->update([
                'alert_verdict_change' => false,
                'alert_compliance_risk' => false,
                'alert_price_change' => false,
                'alert_inapp' => false,
                'alert_push' => false,
            ]);
            return response()->json(['message' => 'Watchlist alert removed']);
        }

        $alert = PriceAlert::where('user_id', $user->id)->where('id', $id)->firstOrFail();
        $alert->delete();

        return response()->json(['message' => 'Alert removed successfully']);
    }
}
