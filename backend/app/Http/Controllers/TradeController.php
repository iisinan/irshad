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

        return $this->success($brokerage, 'Brokerage account successfully linked. Your account has been funded with ₦1,000,000 in simulated trading capital.');
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

        // 1. Verify user has a linked brokerage account
        $brokerage = BrokerageAccount::where('user_id', $user->id)->first();
        if (!$brokerage) {
            return $this->error('Please link a broker before trading.', 400);
        }

        // 2. Load company, its status, and latest price
        $company = Company::with(['status', 'dailyPrices' => fn($q) => $q->latest('date')->limit(1)])
            ->where('symbol', $request->symbol)
            ->first();

        // 3. Shariah Compliance Check
        $statusStr = strtolower($company->status?->status ?? 'unknown');
        if ($statusStr === 'non-halal') {
            return $this->error('Cannot trade this stock. It has been screened as non-halal.', 403);
        }

        if ($statusStr === 'doubtful') {
            return $this->error('Cannot trade this stock. Its compliance status is currently doubtful.', 403);
        }

        // 4. Calculate cost
        $latestPrice = $company->dailyPrices->first()?->price ?? 0;
        if ($latestPrice <= 0) {
            return $this->error('Current price unavailable. Cannot execute trade.', 400);
        }

        $totalCost = $latestPrice * $request->shares;

        // 5. Verify funds
        if ($brokerage->cash_balance < $totalCost) {
            return $this->error('Insufficient funds.', 400);
        }

        DB::beginTransaction();
        try {
            // Deduct funds
            $brokerage->cash_balance -= $totalCost;
            $brokerage->save();

            // Add/Update Holdings
            $holding = Holding::firstOrNew([
                'user_id' => $user->id,
                'company_id' => $company->id,
            ]);

            if ($holding->exists) {
                // Average down cost basis
                $oldTotalValue = $holding->average_buy_price * $holding->shares;
                $newTotalValue = $oldTotalValue + $totalCost;
                $newShares = $holding->shares + $request->shares;
                
                $holding->shares = $newShares;
                $holding->average_buy_price = $newTotalValue / $newShares;
            } else {
                $holding->shares = $request->shares;
                $holding->average_buy_price = $latestPrice;
            }

            $holding->save();
            DB::commit();

            return $this->success([
                'holding' => $holding,
                'new_balance' => $brokerage->cash_balance
            ], "Successfully purchased {$request->shares} shares of {$company->symbol}.");

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Trade execution failed: ' . $e->getMessage(), 500);
        }
    }
}
