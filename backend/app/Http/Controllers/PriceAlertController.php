<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\PriceAlert;
use Illuminate\Http\Request;

class PriceAlertController extends Controller
{
    public function index(Request $request)
    {
        $alerts = $request->user()->priceAlerts()->with('company')->get();

        $formattedAlerts = $alerts->map(function ($alert) {
            return [
                'id' => $alert->id,
                'symbol' => $alert->company->symbol,
                'target_price' => $alert->target_price,
                'condition' => $alert->condition,
                'is_active' => $alert->is_active,
                'created_at' => $alert->created_at,
            ];
        });

        return response()->json(['data' => $formattedAlerts]);
    }

    public function store(Request $request, $symbol)
    {
        $request->validate([
            'target_price' => 'required|numeric|min:0.01',
        ]);

        $company = Company::where('symbol', strtoupper($symbol))->firstOrFail();
        
        // Find latest price to determine condition automatically
        $latestPrice = $company->dailyPrices()->latest('date')->first();
        if (!$latestPrice) {
            return response()->json(['message' => 'No price data available for this stock to set an alert.'], 400);
        }

        $currentPrice = (float) $latestPrice->price;
        $targetPrice = (float) $request->target_price;

        $condition = $targetPrice > $currentPrice ? 'above' : 'below';

        // Update existing active alert or create new one
        $alert = PriceAlert::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'company_id' => $company->id,
                'is_active' => true,
            ],
            [
                'target_price' => $targetPrice,
                'condition' => $condition,
            ]
        );

        return response()->json([
            'message' => "Price alert set! You will be notified when {$symbol} goes {$condition} ₦{$targetPrice}.",
            'data' => $alert
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $alert = PriceAlert::where('user_id', $request->user()->id)->where('id', $id)->firstOrFail();
        $alert->delete();

        return response()->json(['message' => 'Alert removed successfully']);
    }
}
