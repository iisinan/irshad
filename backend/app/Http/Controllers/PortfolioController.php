<?php

namespace App\Http\Controllers;

use App\Models\Holding;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PortfolioController extends Controller
{
    use ApiResponder;

    /**
     * Get the user's portfolio holdings and calculate overall health.
     */
    public function index(): JsonResponse
    {
        $holdings = Holding::with(['company.status', 'company.dailyPrices' => fn($q) => $q->latest('date'), 'company.financials'])
            ->where('user_id', Auth::id())
            ->get();

        $portfolioData = $holdings->map(function ($holding) {
            $company = $holding->company;
            $currentPrice = $company?->dailyPrices?->first()?->price ?? 0;
            $status = $company?->status?->status ?? 'doubtful';
            
            // Financials relationship returns a collection, take first
            $financials = $company?->financials?->first();
            $nonCompliantRatio = $financials?->non_compliant_income_ratio ?? 0;

            $totalValue = $holding->shares * $currentPrice;
            
            $purificationDue = $totalValue * ($nonCompliantRatio / 100);

            // Calculate return
            $returnPercentage = 0;
            if ($holding->average_buy_price && $holding->average_buy_price > 0) {
                $returnPercentage = (($currentPrice - $holding->average_buy_price) / $holding->average_buy_price) * 100;
            }

            return [
                'id' => $holding->id,
                'symbol' => $company->symbol ?? $holding->symbol,
                'name' => $company->name ?? $holding->symbol,
                'shares' => $holding->shares,
                'average_buy_price' => $holding->average_buy_price,
                'current_price' => $currentPrice,
                'total_value' => $totalValue,
                'return_percentage' => round($returnPercentage, 2),
                'status' => strtolower($status),
                'is_halal' => strtolower($status) === 'halal' || strtolower($status) === 'compliant',
                'purification_due' => round($purificationDue, 2),
            ];
        });

        // Get Brokerage Cash
        $brokerage = \App\Models\BrokerageAccount::where('user_id', Auth::id())->first();
        $cashBalance = $brokerage ? $brokerage->cash_balance : 0;

        // Summary
        $stocksBalance = $portfolioData->sum('total_value');
        $totalBalance = $stocksBalance + $cashBalance;
        $totalPurification = $portfolioData->sum('purification_due');
        
        $halalValue = $portfolioData->where('is_halal', true)->sum('total_value');
        $healthPercentage = $stocksBalance > 0 ? round(($halalValue / $stocksBalance) * 100, 1) : 100;

        return $this->success([
            'holdings' => $portfolioData,
            'summary' => [
                'cash_balance' => $cashBalance,
                'total_balance' => $totalBalance,
                'purification_due' => $totalPurification,
                'health_percentage' => $healthPercentage
            ]
        ]);
    }

    /**
     * Add or update a holding.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'symbol' => 'required|string',
            'shares' => 'required|numeric|min:0.01',
            'average_buy_price' => 'nullable|numeric|min:0',
        ]);

        $holding = Holding::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'symbol' => strtoupper($request->symbol),
            ],
            [
                'shares' => $request->shares,
                'average_buy_price' => $request->average_buy_price,
            ]
        );

        return $this->success($holding, 'Holding added to portfolio successfully.');
    }

    /**
     * Remove a holding.
     */
    public function destroy($id): JsonResponse
    {
        $holding = Holding::where('user_id', Auth::id())->where('id', $id)->first();
        
        if (!$holding) {
            return $this->error('Holding not found', 404);
        }

        $holding->delete();

        return $this->success(null, 'Holding removed from portfolio.');
    }
}
