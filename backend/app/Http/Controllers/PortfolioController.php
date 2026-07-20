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
        $holdings = Holding::with(['company.financials:id,company_id,non_compliant_income_ratio'])
            ->where('user_id', Auth::id())
            ->get();

        $portfolioData = $holdings->map(function ($holding) {
            $company = $holding->company;
            $currentPrice = (float) ($company->latest_price ?? 0);
            $status = $company->current_status ?? 'doubtful';
            
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
                'sector' => $company->sector ?? 'Equities',
                'shares' => $holding->shares,
                'average_buy_price' => $holding->average_buy_price,
                'current_price' => $currentPrice,
                'total_value' => $totalValue,
                'return_percentage' => round($returnPercentage, 2),
                'status' => strtolower($status),
                'is_halal' => strtolower($status) === 'halal' || strtolower($status) === 'compliant',
                'purification_due' => round($purificationDue, 2),
                'logo_url' => $company->logo_url ?? null,
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

        // Fetch trailing 30 days of history
        $history = \App\Models\PortfolioSnapshot::where('user_id', Auth::id())
            ->where('date', '>=', now()->subDays(30)->toDateString())
            ->orderBy('date', 'asc')
            ->get(['date', 'total_balance as value']);

        // If today isn't in history yet, append current balance
        if ($history->isEmpty() || $history->last()->date->toDateString() !== now()->toDateString()) {
            $history->push([
                'date' => now()->toDateString(),
                'value' => $totalBalance
            ]);
        }

        return $this->success([
            'holdings' => $portfolioData,
            'summary' => [
                'cash_balance' => $cashBalance,
                'total_balance' => $totalBalance,
                'purification_due' => $totalPurification,
                'health_percentage' => $healthPercentage,
            ],
            'history' => $history
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

    /**
     * Bulk add or update holdings.
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate([
            'holdings' => 'required|array',
            'holdings.*.symbol' => 'required|string|exists:companies,symbol',
            'holdings.*.shares' => 'required|numeric|min:0.01',
            'holdings.*.average_buy_price' => 'nullable|numeric|min:0',
        ]);

        $userId = Auth::id();
        $upsertData = [];

        foreach ($request->holdings as $holdingData) {
            $upsertData[] = [
                'user_id' => $userId,
                'symbol' => strtoupper($holdingData['symbol']),
                'shares' => $holdingData['shares'],
                'average_buy_price' => $holdingData['average_buy_price'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Upsert by user_id and symbol
        Holding::upsert(
            $upsertData,
            ['user_id', 'symbol'], // Unique keys
            ['shares', 'average_buy_price', 'updated_at'] // Columns to update if exists
        );

        return $this->success(null, 'Holdings added to portfolio successfully.');
    }
}
