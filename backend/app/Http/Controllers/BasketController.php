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
     * List all active baskets with tier-based lock metadata.
     */
    public function index(): JsonResponse
    {
        $user = auth('sanctum')->user();
        $userId = $user?->id;
        $basketsLimit = $user ? ($user->tier->features['baskets'] ?? 0) : 0;

        $baskets = Basket::where('is_active', true)
            ->where(function ($query) use ($userId) {
                $query->whereNull('user_id');
                if ($userId) {
                    $query->orWhere('user_id', $userId);
                }
            })
            ->orderBy('id', 'asc')
            ->get();

        $curatedIndex = 0;
        $transformed = $baskets->map(function (Basket $basket) use ($basketsLimit, &$curatedIndex) {
            $isCustom = $basket->user_id !== null;
            $isLocked = false;
            $requiredTier = null;

            if ($basketsLimit === 0) {
                $isLocked = true;
                $requiredTier = 'pro';
                if (!$isCustom) {
                    $curatedIndex++;
                }
            } elseif (!$isCustom) {
                $curatedIndex++;
                if ($basketsLimit > 0 && $curatedIndex > $basketsLimit) {
                    $isLocked = true;
                    $requiredTier = 'max';
                }
            }

            $data = $basket->toArray();
            $rawSymbols = is_array($basket->symbols)
                ? $basket->symbols
                : (json_decode((string) $basket->symbols, true) ?: []);
            $data['stock_count'] = count($rawSymbols);
            $data['is_locked'] = $isLocked;
            $data['required_tier'] = $requiredTier;

            if ($isLocked) {
                $preview = array_slice($rawSymbols, 0, 2);
                $data['symbols'] = $preview;
                $data['symbols_preview'] = $preview;
            }

            return $data;
        });

        return $this->success($transformed);
    }

    /**
     * Show details for a specific basket.
     */
    public function show(Basket $basket): JsonResponse
    {
        $user = auth('sanctum')->user();

        // If it's a private basket, ensure the user owns it
        if ($basket->user_id !== null && $basket->user_id !== $user?->id) {
            return $this->error('Unauthorized', 403);
        }

        if (!$user) {
            return response()->json([
                'error' => 'Upgrade Required',
                'upgrade_required' => true,
                'feature' => 'baskets',
                'required_tier' => 'pro',
                'message' => 'Thematic baskets are available on Rawdha (Pro) and Noor (Max) plans. Please log in and upgrade to view curated baskets.',
            ], 403);
        }

        $basketsLimit = $user->tier->features['baskets'] ?? 0;
        if ($basketsLimit === 0) {
            return response()->json([
                'error' => 'Upgrade Required',
                'upgrade_required' => true,
                'feature' => 'baskets',
                'required_tier' => 'pro',
                'message' => 'Thematic baskets are available on Rawdha (Pro) and Noor (Max) plans. Please upgrade to view and invest in baskets.',
            ], 403);
        }

        if ($basket->user_id === null && $basketsLimit > 0) {
            $curatedRank = Basket::where('is_active', true)
                ->whereNull('user_id')
                ->where('id', '<=', $basket->id)
                ->count();
            if ($curatedRank > $basketsLimit) {
                return response()->json([
                    'error' => 'Upgrade Required',
                    'upgrade_required' => true,
                    'feature' => 'baskets',
                    'required_tier' => 'max',
                    'message' => 'Full access to all thematic baskets requires the Noor (Max) plan.',
                ], 403);
            }
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
            'category' => 'nullable|string|max:100',
            'symbols' => 'required|array',
            'symbols.*' => 'string',
        ]);

        $user = auth('sanctum')->user();
        if ($user) {
            $limit = $user->tier->features['baskets'] ?? 0;
            if ($limit !== -1) {
                $existingCount = Basket::where('user_id', $user->id)->count();
                if ($existingCount >= $limit) {
                    return response()->json([
                        'error' => 'Upgrade Required',
                        'upgrade_required' => true,
                        'feature' => 'baskets',
                        'limit' => $limit,
                        'required_tier' => $limit === 0 ? 'pro' : 'max',
                        'message' => $limit === 0
                            ? 'Custom and thematic baskets are available on Rawdha (Pro) and Noor (Max) plans.'
                            : "You have reached your limit of {$limit} custom baskets. Upgrade to Noor (Max) for unlimited baskets.",
                    ], 403);
                }
            }
        }

        $symbols = array_values(array_unique(array_map('strtoupper', $validated['symbols'])));

        $basket = Basket::create([
            'user_id' => auth('sanctum')->id(),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'] ?? 'Custom',
            'symbols' => $symbols,
            'is_active' => true,
        ]);

        return $this->success($basket, 'Basket created successfully', 201);
    }

    /**
     * Update an existing custom basket.
     */
    public function update(Request $request, Basket $basket): JsonResponse
    {
        if ($basket->user_id !== auth('sanctum')->id()) {
            return $this->error('Unauthorized', 403);
        }

        $user = auth('sanctum')->user();
        $limit = $user ? ($user->tier->features['baskets'] ?? 0) : 0;
        if ($limit === 0) {
            return response()->json([
                'error' => 'Upgrade Required',
                'upgrade_required' => true,
                'feature' => 'baskets',
                'required_tier' => 'pro',
                'message' => 'Custom and thematic baskets are available on Rawdha (Pro) and Noor (Max) plans.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'symbols' => 'sometimes|array',
            'symbols.*' => 'string',
        ]);

        if (isset($validated['symbols'])) {
            $validated['symbols'] = array_values(array_unique(array_map('strtoupper', $validated['symbols'])));
        }

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
        if ($user) {
            $basketsLimit = $user->tier->features['baskets'] ?? 0;
            if ($basketsLimit === 0) {
                return response()->json([
                    'error' => 'Upgrade Required',
                    'upgrade_required' => true,
                    'feature' => 'baskets',
                    'required_tier' => 'pro',
                    'message' => 'Investing in thematic baskets requires Rawdha (Pro) or Noor (Max).',
                ], 403);
            }
            if ($basket->user_id === null && $basketsLimit > 0) {
                $curatedRank = Basket::where('is_active', true)
                    ->whereNull('user_id')
                    ->where('id', '<=', $basket->id)
                    ->count();
                if ($curatedRank > $basketsLimit) {
                    return response()->json([
                        'error' => 'Upgrade Required',
                        'upgrade_required' => true,
                        'feature' => 'baskets',
                        'required_tier' => 'max',
                        'message' => 'This thematic basket requires the Noor (Max) plan.',
                    ], 403);
                }
            }
        }

        $totalAmount = $request->amount;
        $symbols = is_string($basket->symbols) ? json_decode($basket->symbols, true) : $basket->symbols;
        if (is_string($symbols)) {
            $symbols = json_decode($symbols, true);
        }

        if (empty($symbols) || !is_array($symbols)) {
            return $this->error('This basket has no stocks to invest in.', 400);
        }

        // 1. Pre-filter symbols to only include Halal/Compliant stocks
        $investableSymbols = [];
        $skippedSymbols = [];

        foreach ($symbols as $symbol) {
            $company = Company::with(['status', 'aaoifiScreening'])->where('symbol', $symbol)->first();
            if (! $company) {
                continue;
            }

            $statusStr = strtolower($company->current_status ?? $company->status?->status ?? $company->aaoifiScreening?->final_status ?? 'unknown');
            if (in_array($statusStr, ['halal', 'compliant'])) {
                $investableSymbols[] = $symbol;
            } else {
                $skippedSymbols[] = $symbol;
            }
        }

        if (empty($investableSymbols)) {
            return $this->error('Investment blocked: None of the stocks in this basket are currently Shariah-compliant.', 400);
        }

        // Check portfolio holdings limit before executing basket purchase
        if ($user) {
            $existingSymbols = Holding::where('user_id', $user->id)->pluck('symbol')->map('strtoupper')->toArray();
            $newUniqueSymbols = array_diff(array_map('strtoupper', $investableSymbols), $existingSymbols);
            if (!empty($newUniqueSymbols) && !\App\Services\SubscriptionService::canAddPortfolio($user, count($newUniqueSymbols))) {
                $portfolioLimit = $user->tier->features['portfolio_limit'] ?? 3;
                return response()->json([
                    'error' => 'Upgrade Required',
                    'upgrade_required' => true,
                    'feature' => 'portfolio_limit',
                    'limit' => $portfolioLimit,
                    'required_tier' => ($user->tier->slug ?? 'free') === 'free' ? 'pro' : 'max',
                    'message' => "Investing in this basket would exceed your plan's limit of {$portfolioLimit} portfolio holdings. Please upgrade your plan.",
                ], 403);
            }
        }

        $allocationPerStock = $totalAmount / count($investableSymbols);

        try {
            $result = DB::transaction(function () use ($user, $investableSymbols, $allocationPerStock, $totalAmount) {
                $brokerage = BrokerageAccount::where('user_id', $user->id)->lockForUpdate()->first();
                if (! $brokerage) {
                    throw new \Exception('Please link a broker before trading.');
                }

                if ($brokerage->cash_balance < $totalAmount) {
                    throw new \Exception('Insufficient funds.');
                }

                $totalCost = 0;
                $purchases = [];

                foreach ($investableSymbols as $symbol) {
                    $company = Company::with(['dailyPrices' => fn ($q) => $q->latest('date')->limit(1)])
                        ->where('symbol', $symbol)
                        ->first();

                    $latestPrice = $company->dailyPrices->first()?->price ?? 0;
                    if ($latestPrice <= 0) {
                        continue;
                    }

                    $sharesToBuy = floor($allocationPerStock / $latestPrice);
                    if ($sharesToBuy <= 0) {
                        continue;
                    }

                    $cost = $sharesToBuy * $latestPrice;
                    $totalCost += $cost;

                    if ($totalCost > $brokerage->cash_balance) {
                        throw new \Exception('Insufficient funds during allocation.');
                    }

                    $purchases[] = [
                        'company' => $company,
                        'shares' => $sharesToBuy,
                        'price' => $latestPrice,
                        'cost' => $cost,
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
                    'purchases' => collect($purchases)->map(fn ($p) => ['symbol' => $p['company']->symbol, 'shares' => $p['shares'], 'cost' => $p['cost']]),
                ];
            });

            \Illuminate\Support\Facades\Cache::forget("portfolio_data_" . $user->id);

            return $this->success($result, 'Successfully invested in basket.');
        } catch (\Exception $e) {
            $code = str_contains($e->getMessage(), 'link a broker') || str_contains($e->getMessage(), 'funds') || str_contains($e->getMessage(), 'Cannot invest') ? 400 : 500;

            return $this->error('Investment failed: '.$e->getMessage(), $code);
        }
    }
}
