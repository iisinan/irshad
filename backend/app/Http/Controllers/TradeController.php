<?php

namespace App\Http\Controllers;

use App\Models\BrokerageAccount;
use App\Models\Company;
use App\Models\Holding;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TradeController extends Controller
{
    use ApiResponder;

    /**
     * Link a simulated broker account with initial funds.
     */
    public function linkBroker(Request $request): JsonResponse
    {
        $request->validate([
            'broker_name' => 'required|string|max:255',
        ]);

        $user = auth()->user();

        // Check if user already has a linked broker
        $existing = BrokerageAccount::where('user_id', $user->id)->first();
        if ($existing) {
            return $this->error('You already have a linked broker.', 400);
        }

        // Create a new simulated broker account with ₦1,000,000 mock funds
        $brokerage = BrokerageAccount::create([
            'user_id' => $user->id,
            'broker_name' => $request->broker_name,
            'access_token' => 'mock_token_' . uniqid(),
            'cash_balance' => 1000000.00, // ₦1M
        ]);

        // Seed some mock holdings to populate the portfolio instantly
        $mockStocks = [
            ['symbol' => 'MTNN', 'shares' => 500, 'price' => 240.50],
            ['symbol' => 'DANGCEM', 'shares' => 100, 'price' => 650.00],
            ['symbol' => 'ZENITHBANK', 'shares' => 2000, 'price' => 38.00],
            ['symbol' => 'GTCO', 'shares' => 1500, 'price' => 42.50]
        ];

        foreach ($mockStocks as $stock) {
            \App\Models\Holding::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'symbol' => $stock['symbol']
                ],
                [
                    'shares' => $stock['shares'],
                    'average_buy_price' => $stock['price']
                ]
            );
        }

        return $this->success($brokerage, 'Brokerage account successfully linked. Your portfolio has been populated with simulated holdings and ₦1,000,000 in cash.');
    }

    /**
     * Execute a simulated stock purchase.
     */
    public function executeTrade(Request $request): JsonResponse
    {
        $request->validate([
            'symbol' => 'required|string|exists:companies,symbol',
            'shares' => 'required|numeric|min:1',
        ]);

        $user = auth()->user();

        // 1. Load company, its status, and latest price
        $company = Company::with(['status', 'dailyPrices' => fn($q) => $q->latest('date')->limit(1)])
            ->where('symbol', $request->symbol)
            ->first();

        // 2. Shariah Compliance Check
        $statusStr = strtolower($company->status?->status ?? 'unknown');
        if ($statusStr === 'non-halal') {
            return $this->error('Cannot trade this stock. It has been screened as non-halal.', 403);
        }

        if ($statusStr === 'doubtful') {
            return $this->error('Cannot trade this stock. Its compliance status is currently doubtful.', 403);
        }

        // 3. Calculate cost
        $latestPrice = $company->dailyPrices->first()?->price ?? 0;
        if ($latestPrice <= 0) {
            return $this->error('Current price unavailable. Cannot execute trade.', 400);
        }

        $totalCost = $latestPrice * $request->shares;

        try {
            $result = DB::transaction(function () use ($user, $company, $request, $latestPrice, $totalCost) {
                // 4. Lock the brokerage account to prevent race conditions
                $brokerage = BrokerageAccount::where('user_id', $user->id)->lockForUpdate()->first();
                if (!$brokerage) {
                    throw new \Exception('Please link a broker before trading.');
                }

                // 5. Verify funds
                if ($brokerage->cash_balance < $totalCost) {
                    throw new \Exception('Insufficient funds.');
                }

                // 6. Deduct funds
                $brokerage->cash_balance -= $totalCost;
                $brokerage->save();

                // 7. Lock the holding if it exists, or create new
                $holding = Holding::where('user_id', $user->id)
                    ->where('symbol', $company->symbol)
                    ->lockForUpdate()
                    ->first();

                if ($holding) {
                    // Average down cost basis
                    $oldTotalValue = $holding->average_buy_price * $holding->shares;
                    $newTotalValue = $oldTotalValue + $totalCost;
                    $newShares = $holding->shares + $request->shares;
                    
                    $holding->shares = $newShares;
                    $holding->average_buy_price = $newTotalValue / $newShares;
                } else {
                    $holding = new Holding([
                        'user_id' => $user->id,
                        'symbol' => $company->symbol,
                        'shares' => $request->shares,
                        'average_buy_price' => $latestPrice,
                    ]);
                }
                $holding->save();

                return [
                    'holding' => $holding,
                    'new_balance' => $brokerage->cash_balance
                ];
            });

            return $this->success($result, "Successfully purchased {$request->shares} shares of {$company->symbol}.");

        } catch (\Exception $e) {
            $code = $e->getMessage() === 'Insufficient funds.' || $e->getMessage() === 'Please link a broker before trading.' ? 400 : 500;
            return $this->error('Trade execution failed: ' . $e->getMessage(), $code);
        }
    }
}
