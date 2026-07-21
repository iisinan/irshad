<?php

namespace App\Http\Controllers;

use App\Models\Basket;
use App\Models\BrokerageAccount;
use App\Models\Company;
use App\Models\Holding;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BasketController extends Controller
{
    use ApiResponder;

    /**
     * List all active baskets.
     */
    public function index(): JsonResponse
    {
        $userId = auth('sanctum')->id();
        $baskets = Basket::where('is_active', true)
            ->where(function ($query) use ($userId) {
                $query->whereNull('user_id');
                if ($userId) {
                    $query->orWhere('user_id', $userId);
                }
            })
            ->get();
            
        return $this->success($baskets);
    }

    /**
     * Show details for a specific basket.
     */
    public function show(Basket $basket): JsonResponse
    {
        // If it's a private basket, ensure the user owns it
        if ($basket->user_id !== null && $basket->user_id !== auth('sanctum')->id()) {
            return $this->error('Unauthorized', 403);
        }
        return $this->success($basket);
    }

    /**
     * Create a new custom basket for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'symbols' => 'required|array',
            'symbols.*' => 'string'
        ]);

        $basket = Basket::create([
            'user_id' => auth('sanctum')->id(),
            'name' => $validated['name'],
            'description' => $validated['description'],
            'symbols' => $validated['symbols'],
            'is_active' => true,
        ]);

        return $this->success($basket, 201);
    }

    /**
     * Update an existing custom basket.
     */
    public function update(Request $request, Basket $basket): JsonResponse
    {
        if ($basket->user_id !== auth('sanctum')->id()) {
            return $this->error('Unauthorized', 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'symbols' => 'sometimes|array',
            'symbols.*' => 'string'
        ]);

        $basket->update($validated);

        return $this->success($basket);
    }

    /**
     * Delete a custom basket.
     */
    public function destroy(Basket $basket): JsonResponse
    {
        if ($basket->user_id !== auth('sanctum')->id()) {
            return $this->error('Unauthorized', 403);
        }

        $basket->delete();
        return $this->success(['message' => 'Basket deleted successfully']);
    }

    /**
     * Invest a specific amount into a basket.
     */
    public function invest(Request $request, Basket $basket): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:1000',
        ]);

        if ($basket->user_id !== null && $basket->user_id !== auth('sanctum')->id()) {
            return $this->error('Unauthorized', 403);
        }

        $user = auth('sanctum')->user();
        $totalAmount = $request->amount;
        $symbols = is_string($basket->symbols) ? json_decode($basket->symbols, true) : $basket->symbols;

        if (empty($symbols)) {
            return $this->error('This basket has no stocks to invest in.', 400);
        }

        // 1. Pre-filter symbols to only include Halal/Compliant stocks
        $investableSymbols = [];
        $skippedSymbols = [];

        foreach ($symbols as $symbol) {
            $company = Company::with('status')->where('symbol', $symbol)->first();
            if (!$company) continue;
            
            $statusStr = strtolower($company->status?->status ?? 'unknown');
            if (in_array($statusStr, ['halal', 'compliant'])) {
                $investableSymbols[] = $symbol;
            } else {
                $skippedSymbols[] = $symbol;
            }
        }

        if (empty($investableSymbols)) {
            return $this->error('Investment blocked: None of the stocks in this basket are currently Shariah-compliant.', 400);
        }

        $allocationPerStock = $totalAmount / count($investableSymbols);

        try {
            $result = DB::transaction(function () use ($user, $investableSymbols, $allocationPerStock, $totalAmount) {
                $brokerage = BrokerageAccount::where('user_id', $user->id)->lockForUpdate()->first();
                if (!$brokerage) {
                    throw new \Exception('Please link a broker before trading.');
                }

                if ($brokerage->cash_balance < $totalAmount) {
                    throw new \Exception('Insufficient funds.');
                }

                $totalCost = 0;
                $purchases = [];

                foreach ($investableSymbols as $symbol) {
                    $company = Company::with(['dailyPrices' => fn($q) => $q->latest('date')->limit(1)])
                        ->where('symbol', $symbol)
                        ->first();

                    $latestPrice = $company->dailyPrices->first()?->price ?? 0;
                    if ($latestPrice <= 0) continue;

                    $sharesToBuy = floor($allocationPerStock / $latestPrice);
                    if ($sharesToBuy <= 0) continue;

                    $cost = $sharesToBuy * $latestPrice;
                    $totalCost += $cost;

                    if ($totalCost > $brokerage->cash_balance) {
                        throw new \Exception('Insufficient funds during allocation.');
                    }

                    $purchases[] = [
                        'company' => $company,
                        'shares' => $sharesToBuy,
                        'price' => $latestPrice,
                        'cost' => $cost
                    ];
                }

                if (empty($purchases)) {
                    throw new \Exception('Amount too small to purchase any whole shares.');
                }

                // 2. Deduct total exact cost (leaving fractional change as cash)
                $brokerage->cash_balance -= $totalCost;
                $brokerage->save();

                // 3. Create or update holdings
                foreach ($purchases as $purchase) {
                    $holding = Holding::where('user_id', $user->id)
                        ->where('symbol', $purchase['company']->symbol)
                        ->lockForUpdate()
                        ->first();

                    if ($holding) {
                        $oldTotalValue = $holding->average_buy_price * $holding->shares;
                        $newTotalValue = $oldTotalValue + $purchase['cost'];
                        $newShares = $holding->shares + $purchase['shares'];
                        
                        $holding->shares = $newShares;
                        $holding->average_buy_price = $newTotalValue / $newShares;
                    } else {
                        $holding = new Holding([
                            'user_id' => $user->id,
                            'symbol' => $purchase['company']->symbol,
                            'shares' => $purchase['shares'],
                            'average_buy_price' => $purchase['price'],
                        ]);
                    }
                    $holding->save();
                }

                return [
                    'total_invested' => $totalCost,
                    'new_balance' => $brokerage->cash_balance,
                    'purchases' => collect($purchases)->map(fn($p) => ['symbol' => $p['company']->symbol, 'shares' => $p['shares'], 'cost' => $p['cost']])
                ];
            });

            return $this->success($result, 'Successfully invested in basket.');
        } catch (\Exception $e) {
            $code = str_contains($e->getMessage(), 'link a broker') || str_contains($e->getMessage(), 'funds') || str_contains($e->getMessage(), 'Cannot invest') ? 400 : 500;
            return $this->error('Investment failed: ' . $e->getMessage(), $code);
        }
    }
}
