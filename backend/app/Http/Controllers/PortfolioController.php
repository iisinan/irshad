<?php

namespace App\Http\Controllers;

use App\Models\BrokerageAccount;
use App\Models\Company;
use App\Models\Holding;
use App\Models\Setting;
use App\Models\PortfolioSnapshot;
use App\Models\Watchlist;
use App\Services\StatementParserService;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class PortfolioController extends Controller
{
    use ApiResponder;

    /**
     * Get the user's portfolio holdings and calculate overall health.
     */
    public function index(): JsonResponse
    {
        $userId = Auth::id();
        $cacheKey = "portfolio_data_{$userId}";

        $data = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($userId) {
            try {
                $exchangeRate = (float) (\App\Models\Setting::where('key', 'zakat_exchange_rate')->value('value') ?? 1600.0);
            } catch (\Exception $e) {
                $exchangeRate = 1600.0;
            }

            $holdings = Holding::with([
                'company.financials:id,company_id,total_revenue,interest_income',
                'company.aaoifiScreening',
                'company.latestDividend',
                                'company.dividends' => function ($query) {
                    $query->whereIn('status', ['paid', 'upcoming', 'declared'])
                        ->where(function ($q) {
                            $q->where('pay_date', '>=', now()->subMonths(12))
                              ->orWhereNull('pay_date');
                        });
                },
            ])
                ->where('user_id', $userId)
                ->get();

            $portfolioData = $holdings->map(function ($holding) use ($userId, $exchangeRate) {
                try {
                    $company = $holding->company;
                    $currentPrice = (float) ($company?->latest_price ?? 0);
                    if ($currentPrice <= 0 && (float) ($holding->average_buy_price ?? 0) > 0) {
                        $currentPrice = (float) $holding->average_buy_price;
                    }
                    $status = $company?->current_status ?? $company?->aaoifiScreening?->final_status ?? 'doubtful';

                    $screening = $company?->aaoifiScreening;
                    $nonCompliantRatio = (float) ($screening?->impermissible_income_ratio ?? 0);
                    if ($nonCompliantRatio <= 0 && $company && $company->financials && $company->financials->isNotEmpty()) {
                        $fin = $company->financials->sortByDesc('id')->first();
                        if ((float)($fin->total_revenue ?? 0) > 0 && (float)($fin->interest_income ?? 0) > 0) {
                            $nonCompliantRatio = ((float)$fin->interest_income / (float)$fin->total_revenue) * 100;
                        }
                    }

                    $totalValue = (float) ($holding->shares * $currentPrice);

                    $isHalal = strtolower($status) === 'halal' || strtolower($status) === 'compliant';

                    // Fetch latest purification date for this symbol
                    $latestPurificationDate = \App\Models\Purification::where('user_id', $userId)
                        ->where('symbol', $holding->symbol)
                        ->latest()
                        ->value('created_at');

                    $purchaseDate = null;
                    try {
                        if ($holding->purchase_date) {
                            $purchaseDate = \Carbon\Carbon::parse($holding->purchase_date);
                        } elseif ($holding->created_at) {
                            $purchaseDate = \Carbon\Carbon::parse($holding->created_at);
                        } else {
                            $purchaseDate = now();
                        }
                    } catch (\Throwable $e) {
                        $purchaseDate = now();
                    }

                    // Calculate Purification Due based on paid dividends in the trailing 12 months.
                    $trailingDividendsPerShare = 0;
                    $lifetimeDividendsPerShare = 0;

                    if ($company && $company->dividends) {
                        $trailingDividendsPerShare = $company->dividends->filter(function ($dividend) use ($latestPurificationDate, $purchaseDate) {
                            try {
                                $effectiveDate = $dividend->pay_date ? \Carbon\Carbon::parse($dividend->pay_date) : 
                                              ($dividend->ex_date ? \Carbon\Carbon::parse($dividend->ex_date) : ($dividend->created_at ? \Carbon\Carbon::parse($dividend->created_at) : now()));
                                $exDate = $dividend->ex_date ? \Carbon\Carbon::parse($dividend->ex_date) : $effectiveDate;

                                // 1. Cannot owe purification on dividends not yet received
                                if ($effectiveDate->isFuture()) return false;

                                // 2. Cannot owe purification on dividends from before you bought the stock
                                if ($purchaseDate->copy()->startOfDay()->isAfter($exDate->copy()->startOfDay())) return false;

                                // 3. Cannot owe purification on dividends already purified
                                if ($latestPurificationDate && $effectiveDate->lessThanOrEqualTo($latestPurificationDate)) return false;

                                return true;
                            } catch (\Throwable $e) {
                                return false;
                            }
                        })->reduce(function ($carry, $dividend) use ($exchangeRate) {
                            $amount = (float) ($dividend->amount ?? 0);
                            if (strtoupper($dividend->currency ?? 'NGN') === 'USD') {
                                $amount *= $exchangeRate; 
                            }
                            return $carry + $amount;
                        }, 0) ?? 0;
                        
                        // Calculate Lifetime Dividends (ignores purification date)
                        $lifetimeDividendsPerShare = $company->dividends->filter(function ($dividend) use ($purchaseDate) {
                            try {
                                $effectiveDate = $dividend->pay_date ? \Carbon\Carbon::parse($dividend->pay_date) : 
                                              ($dividend->ex_date ? \Carbon\Carbon::parse($dividend->ex_date) : ($dividend->created_at ? \Carbon\Carbon::parse($dividend->created_at) : now()));
                                $exDate = $dividend->ex_date ? \Carbon\Carbon::parse($dividend->ex_date) : $effectiveDate;
                                if ($effectiveDate->isFuture()) return false;
                                if ($purchaseDate->copy()->startOfDay()->isAfter($exDate->copy()->startOfDay())) return false;
                                return true;
                            } catch (\Throwable $e) {
                                return false;
                            }
                        })->reduce(function ($carry, $dividend) use ($exchangeRate) {
                            $amount = (float) ($dividend->amount ?? 0);
                            if (strtoupper($dividend->currency ?? 'NGN') === 'USD') {
                                $amount *= $exchangeRate; 
                            }
                            return $carry + $amount;
                        }, 0) ?? 0;
                    }
                    
                    $totalDividendsReceived = $holding->shares * $trailingDividendsPerShare;
                    $lifetimeDividendsReceived = $holding->shares * $lifetimeDividendsPerShare;

                    if ($company && $company->asset_class === 'mutual_fund') {
                        $fundDetails = $company->fund_details ?? [];
                        $history = $fundDetails['purification_history'] ?? [];
                        if (!empty($history) && is_array($history)) {
                            usort($history, fn($a, $b) => ($b['year'] ?? 0) <=> ($a['year'] ?? 0));
                            $latestYear = (int) ($history[0]['year'] ?? 0);
                            $latestPerUnit = $history[0]['per_unit'] ?? 0;
                            // Already settled if the user purified after that entry's year began
                            $alreadyPurified = $latestPurificationDate && $latestYear > 0
                                && \Carbon\Carbon::parse($latestPurificationDate)->greaterThanOrEqualTo(\Carbon\Carbon::create($latestYear, 1, 1));
                            $purificationDue = ($isHalal && !$alreadyPurified) ? $holding->shares * $latestPerUnit : 0;
                        } else {
                            $purificationDue = 0;
                        }
                    } else {
                        $purificationDue = $isHalal ? $totalDividendsReceived * ($nonCompliantRatio / 100) : 0;
                    }

                    // Calculate return
                    $returnPercentage = 0;
                    if ($holding->average_buy_price && (float) $holding->average_buy_price > 0) {
                        $returnPercentage = (($currentPrice - (float) $holding->average_buy_price) / (float) $holding->average_buy_price) * 100;
                    }

                    $latestDivData = null;
                    if ($company?->latestDividend) {
                        $payDate = null;
                        if ($company->latestDividend->pay_date) {
                            if ($company->latestDividend->pay_date instanceof \Carbon\CarbonInterface) {
                                $payDate = $company->latestDividend->pay_date->toISOString();
                            } else {
                                $payDate = (string) $company->latestDividend->pay_date;
                            }
                        }
                        $latestDivData = [
                            'amount' => $company->latestDividend->amount,
                            'pay_date' => $payDate,
                            'status' => $company->latestDividend->status,
                        ];
                    }

                    // Find upcoming announced dividend if any
                    $upcomingDivData = null;
                    if ($company && $company->dividends) {
                        $upcoming = $company->dividends->filter(function ($d) {
                            if (!$d->pay_date) return false;
                            try {
                                $effectiveDate = \Carbon\Carbon::parse($d->pay_date)->startOfDay();
                                return $effectiveDate->greaterThanOrEqualTo(now()->startOfDay());
                            } catch (\Throwable $e) {
                                return false;
                            }
                        })->sortBy(function ($d) {
                            return \Carbon\Carbon::parse($d->pay_date)->timestamp;
                        })->first();

                        if ($upcoming) {
                            $payDateCarbon = \Carbon\Carbon::parse($upcoming->pay_date)->startOfDay();
                            $daysLeft = (int) now()->startOfDay()->diffInDays($payDateCarbon, false);
                            $upcomingDivData = [
                                'amount' => (float) ($upcoming->amount ?? 0),
                                'pay_date' => $payDateCarbon->toISOString(),
                                'days_left' => max(0, $daysLeft),
                                'status' => $upcoming->status ?? 'upcoming',
                            ];
                        }
                    }

                    return [
                        'id' => $holding->id,
                        'symbol' => $company?->symbol ?? $holding->symbol,
                        'name' => $company?->name ?? $holding->symbol,
                        'sector' => $company?->sector ?? 'Equities',
                        'shares' => (float) $holding->shares,
                        'average_buy_price' => $holding->average_buy_price,
                        'current_price' => $currentPrice,
                        'total_value' => $totalValue,
                        'return_percentage' => round($returnPercentage, 2),
                        'status' => strtolower($status),
                        'is_halal' => $isHalal,
                        'purification_due' => round($purificationDue, 2),
                        'purification_required' => $isHalal && ($nonCompliantRatio > 0 || $purificationDue > 0),
                        'total_dividends' => round($totalDividendsReceived, 2),
                        'lifetime_dividends' => round($lifetimeDividendsReceived, 2),
                        'latest_dividend' => $latestDivData,
                        'upcoming_dividend' => $upcomingDivData,
                        'non_compliant_ratio' => round($nonCompliantRatio, 2),
                        'logo_url' => $company?->logo_url ?? null,
                        'grace_period_ends_at' => $holding->grace_period_ends_at ? ($holding->grace_period_ends_at instanceof \Carbon\CarbonInterface ? $holding->grace_period_ends_at->toISOString() : (string) $holding->grace_period_ends_at) : null,
                        'purchase_date' => $holding->purchase_date,
                        'created_at' => $holding->created_at instanceof \Carbon\CarbonInterface ? $holding->created_at->toISOString() : (string) $holding->created_at,
                        'updated_at' => $holding->updated_at instanceof \Carbon\CarbonInterface ? $holding->updated_at->toISOString() : (string) $holding->updated_at,
                    ];
                } catch (\Throwable $err) {
                    \Illuminate\Support\Facades\Log::warning("Error processing holding ID {$holding->id} ({$holding->symbol}): " . $err->getMessage());
                    return [
                        'id' => $holding->id,
                        'symbol' => $holding->symbol,
                        'name' => $holding->symbol,
                        'sector' => 'Equities',
                        'shares' => (float) $holding->shares,
                        'average_buy_price' => $holding->average_buy_price,
                        'current_price' => 0,
                        'total_value' => 0,
                        'return_percentage' => 0,
                        'status' => 'doubtful',
                        'is_halal' => false,
                        'purification_due' => 0,
                        'purification_required' => false,
                        'total_dividends' => 0,
                        'lifetime_dividends' => 0,
                        'latest_dividend' => null,
                        'non_compliant_ratio' => 0,
                        'logo_url' => null,
                        'grace_period_ends_at' => $holding->grace_period_ends_at ? ($holding->grace_period_ends_at instanceof \Carbon\CarbonInterface ? $holding->grace_period_ends_at->toISOString() : (string) $holding->grace_period_ends_at) : null,
                        'purchase_date' => $holding->purchase_date,
                        'created_at' => $holding->created_at instanceof \Carbon\CarbonInterface ? $holding->created_at->toISOString() : (string) $holding->created_at,
                        'updated_at' => $holding->updated_at instanceof \Carbon\CarbonInterface ? $holding->updated_at->toISOString() : (string) $holding->updated_at,
                    ];
                }
            });

            // Get Brokerage Cash
            $brokerage = BrokerageAccount::where('user_id', $userId)->first();
            $cashBalance = (float) ($brokerage?->cash_balance ?? 0.0);

            // Summary
            $stocksBalance = (float) $portfolioData->sum('total_value');
            $totalBalance = $stocksBalance + $cashBalance;
            $totalPurification = (float) $portfolioData->sum('purification_due');

            $halalValue = (float) $portfolioData->where('is_halal', true)->sum('total_value');
            $healthPercentage = $stocksBalance > 0 ? round(($halalValue / $stocksBalance) * 100, 1) : 100;

            // Fetch trailing 30 days of history safely
            try {
                $history = PortfolioSnapshot::where('user_id', $userId)
                    ->where('date', '>=', now()->subDays(30)->toDateString())
                    ->orderBy('date', 'asc')
                    ->get(['date', 'total_balance as value']);
            } catch (\Throwable $e) {
                $history = collect();
            }

            // If today isn't in history yet, append current balance
            $hasToday = false;
            if ($history->isNotEmpty()) {
                $lastItem = $history->last();
                $lastDate = null;
                if ($lastItem) {
                    if (isset($lastItem->date) && $lastItem->date instanceof \Carbon\CarbonInterface) {
                        $lastDate = $lastItem->date->toDateString();
                    } elseif (is_string($lastItem->date ?? null)) {
                        $lastDate = substr($lastItem->date, 0, 10);
                    }
                }
                $hasToday = ($lastDate === now()->toDateString());
            }

            if (!$hasToday) {
                $history->push([
                    'date' => now()->toDateString(),
                    'value' => $totalBalance,
                ]);
            }

            // Fetch purifications history safely
            try {
                $purifications = \App\Models\Purification::where('user_id', $userId)
                    ->orderBy('created_at', 'desc')
                    ->get();
            } catch (\Throwable $e) {
                $purifications = collect();
            }

            return [
                'holdings' => $portfolioData,
                'summary' => [
                    'cash_balance' => $cashBalance,
                    'total_balance' => $totalBalance,
                    'purification_due' => $totalPurification,
                    'health_percentage' => $healthPercentage,
                ],
                'history' => $history,
                'purifications' => $purifications,
            ];
        });

        return $this->success($data);
    }

    /**
     * Add or update a holding.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'symbol' => 'required|string',
            'name' => 'nullable|string',
            'shares' => 'required|numeric|min:0.0001',
            'average_buy_price' => 'nullable|numeric|min:0',
            'purchase_date' => 'nullable|date',
        ]);

        $sym = strtoupper(trim($request->symbol));
        $price = $request->has('average_buy_price') ? (float) $request->average_buy_price : 0.0;
        $name = !empty($request->name) ? trim($request->name) : $sym;

        // Ensure company exists in companies table
        $company = Company::where('symbol', $sym)->first();
        if (!$company) {
            Company::create([
                'symbol' => $sym,
                'name' => $name,
                'sector' => 'Equities',
                'current_status' => 'doubtful',
                'latest_price' => $price,
                'activity_reason' => 'User-added holding; pending compliance verification.',
                'is_active' => true,
                'is_sec_registered' => false,
                'asset_class' => 'equity',
            ]);
        }

        // Limit Check
        $exists = Holding::where('user_id', Auth::id())->where('symbol', $sym)->exists();
        if (!$exists && !\App\Services\SubscriptionService::canAddPortfolio(Auth::user())) {
            return response()->json([
                'error' => 'Upgrade Required',
                'message' => 'You have reached your portfolio limit for this plan.'
            ], 403);
        }

        $holdingData = [
            'shares' => $request->shares,
            'average_buy_price' => $request->average_buy_price,
            'purchase_date' => $request->purchase_date ?? now(),
        ];

        if ($company && in_array(strtolower($company->current_status ?? ''), ['non-compliant', 'non_compliant', 'non-halal', 'non_halal'])) {
            $existingHolding = Holding::where('user_id', Auth::id())->where('symbol', $sym)->first();
            if (!$existingHolding || !$existingHolding->grace_period_ends_at) {
                $holdingData['grace_period_ends_at'] = now()->addDays(90);
                $holdingData['grace_period_notified'] = false;
            }
        }

        $holding = Holding::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'symbol' => $sym,
            ],
            $holdingData
        );

        Cache::forget("portfolio_data_" . Auth::id());

        return $this->success($holding, 'Holding added to portfolio successfully.');
    }

    public function update(Request $request, $id): JsonResponse
    {
        $request->validate([
            'symbol' => 'nullable|string',
            'shares' => 'required|numeric|min:0',
            'average_buy_price' => 'required|numeric|min:0',
        ]);

        $holding = Holding::where('user_id', Auth::id())->where('id', $id)->first();

        if (! $holding) {
            return $this->error('Holding not found', 404);
        }

        $updateData = [
            'shares' => $request->shares,
            'average_buy_price' => $request->average_buy_price,
        ];
        if ($request->has('symbol') && !empty($request->symbol)) {
            $updateData['symbol'] = strtoupper($request->symbol);
        }

        $holding->update($updateData);

        Cache::forget("portfolio_data_" . Auth::id());

        return $this->success($holding, 'Holding updated successfully.');
    }

    /**
     * Remove a holding.
     */
    public function destroy($id): JsonResponse
    {
        $holding = Holding::where('user_id', Auth::id())->where('id', $id)->first();

        if (! $holding) {
            return $this->error('Holding not found', 404);
        }

        $holding->delete();

        Cache::forget("portfolio_data_" . Auth::id());

        return $this->success(null, 'Holding removed from portfolio.');
    }

    /**
     * Bulk add or update holdings.
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate([
            'holdings' => 'required|array',
            'holdings.*.symbol' => 'required|string',
            'holdings.*.name' => 'nullable|string',
            'holdings.*.shares' => 'required|numeric|min:0.0001',
            'holdings.*.average_buy_price' => 'nullable|numeric|min:0',
            'holdings.*.purchase_date' => 'nullable|date',
        ]);

        $userId = Auth::id();
        
        // Limit Check
        $limit = Auth::user()->tier->features['portfolio_limit'] ?? 0;
        if ($limit !== -1) {
            $existingCount = Holding::where('user_id', $userId)->count();
            // Count unique new symbols
            $newSymbols = collect($request->holdings)->pluck('symbol')->map(fn($s) => strtoupper(trim($s)))->unique();
            $alreadyOwned = Holding::where('user_id', $userId)->whereIn('symbol', $newSymbols)->count();
            $newAdditions = $newSymbols->count() - $alreadyOwned;
            
            if ($existingCount + $newAdditions > $limit) {
                return response()->json([
                    'error' => 'Upgrade Required',
                    'message' => 'Adding these stocks exceeds your portfolio limit for this plan.'
                ], 403);
            }
        }

        $upsertData = [];

        foreach ($request->holdings as $holdingData) {
            $sym = strtoupper(trim($holdingData['symbol']));
            $shares = (float) $holdingData['shares'];
            $price = isset($holdingData['average_buy_price']) ? (float) $holdingData['average_buy_price'] : 0.0;
            $name = !empty($holdingData['name']) ? trim($holdingData['name']) : $sym;

            // Ensure company exists in companies table so holding is cleanly linked and displayed
            $company = Company::where('symbol', $sym)->first();
            if (!$company) {
                Company::create([
                    'symbol' => $sym,
                    'name' => $name,
                    'sector' => 'Equities',
                    'current_status' => 'doubtful',
                    'latest_price' => $price,
                    'activity_reason' => 'User-added / statement imported holding; pending compliance verification.',
                    'is_active' => true,
                    'is_sec_registered' => false,
                    'asset_class' => 'equity',
                ]);
            }

            $upsertData[] = [
                'user_id' => $userId,
                'symbol' => $sym,
                'shares' => $shares,
                'average_buy_price' => $price > 0 ? $price : null,
                'purchase_date' => $holdingData['purchase_date'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Upsert by user_id and symbol
        Holding::upsert(
            $upsertData,
            ['user_id', 'symbol'], // Unique keys
            ['shares', 'average_buy_price', 'purchase_date', 'updated_at'] // Columns to update if exists
        );

        Cache::forget("portfolio_data_" . $userId);

        return $this->success(null, 'Holdings added to portfolio successfully.');
    }

    /**
     * Parse an uploaded broker statement (PDF, CSV, XLSX) and return reconciled holdings.
     */
    public function parseStatement(Request $request, StatementParserService $parser): JsonResponse
    {
        $request->validate([
            'statement' => 'required|file|max:15360', // max 15MB
            'password' => 'nullable|string',
        ]);

        $file = $request->file('statement');
        $password = $request->input('password');

        try {
            $result = $parser->parse($file, $password);

            if (!empty($result['password_required'])) {
                return response()->json([
                    'status' => 'password_required',
                    'message' => $result['message'] ?? 'This statement is password protected.',
                    'data' => $result,
                ], 200);
            }

            return $this->success($result, 'Statement parsed successfully.');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('[PortfolioController] parseStatement error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Unable to parse statement: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get portfolio movers (gainers and losers) based on holdings and watchlist.
     */
    public function movers(): JsonResponse
    {
        $userId = Auth::id();

        $data = Cache::remember("portfolio_movers_{$userId}", now()->addMinutes(15), function () use ($userId) {
            $holdingSymbols = Holding::where('user_id', $userId)->pluck('symbol')->toArray();
            $watchlistSymbols = Watchlist::where('user_id', $userId)->pluck('symbol')->toArray();

            $allSymbols = array_unique(array_merge($holdingSymbols, $watchlistSymbols));

            if (empty($allSymbols)) {
                return ['gainers' => [], 'losers' => []];
            }

            $companies = Company::select(['id', 'symbol', 'name', 'latest_price', 'price_change_pct', 'logo_url'])
                ->whereIn('symbol', $allSymbols)
                ->whereNotNull('price_change_pct')
                ->get();

            $gainers = $companies->where('price_change_pct', '>', 0)->sortByDesc('price_change_pct')->take(3)->values();
            $losers = $companies->where('price_change_pct', '<', 0)->sortBy('price_change_pct')->take(3)->values();

            return [
                'gainers' => $gainers,
                'losers' => $losers,
            ];
        });

        return $this->success($data);
    }
    public function purify(Request $request): JsonResponse
    {
        $request->validate([
            'symbol' => 'nullable|string',
            'all' => 'nullable|boolean'
        ]);

        $user = Auth::user();
        if (!\App\Services\SubscriptionService::canUseFeature($user, 'purifications_per_month')) {
            return response()->json([
                'error' => 'Upgrade Required',
                'message' => 'You have reached your monthly limit for generating purification statements. Please upgrade your plan.'
            ], 403);
        }

        try {
            $exchangeRate = (float) (\App\Models\Setting::where('key', 'zakat_exchange_rate')->value('value') ?? 1600.0);
        } catch (\Exception $e) {
            $exchangeRate = 1600.0;
        }

        $userId = Auth::id();
        $symbolsToPurify = [];

        if ($request->all) {
            $symbolsToPurify = Holding::where('user_id', $userId)->pluck('symbol')->toArray();
        } elseif ($request->symbol) {
            $symbolsToPurify = [$request->symbol];
        } else {
            return $this->error('Must provide a symbol or all=true', 400);
        }

        $purifiedCount = 0;

        foreach ($symbolsToPurify as $symbol) {
            $holding = Holding::where('user_id', $userId)->where('symbol', $symbol)->first();
            if (!$holding) continue;

            $company = Company::with([
                'aaoifiScreening',
                'dividends' => function ($query) {
                    // Match the same 12-month window used in the portfolio index
                    $query->whereIn('status', ['paid', 'upcoming', 'declared'])
                        ->where(function ($q) {
                            $q->where('pay_date', '>=', now()->subMonths(12))
                              ->orWhereNull('pay_date');
                        });
                },
            ])->where('symbol', $symbol)->first();
            if (!$company) continue;

            $status = $company->current_status ?? $company->aaoifiScreening?->final_status ?? 'doubtful';
            $isHalal = strtolower($status) === 'halal' || strtolower($status) === 'compliant';

            // Only purify halal stocks — non-halal stocks shouldn't be on this tab
            if (!$isHalal) continue;

            $screening = $company->aaoifiScreening;
            $nonCompliantRatio = $screening?->impermissible_income_ratio ?? 0;

            // Fetch latest purification date for this symbol
            $latestPurificationDate = \App\Models\Purification::where('user_id', $userId)
                ->where('symbol', $symbol)
                ->latest()
                ->value('created_at');

            $purchaseDate = null;
            try {
                if ($holding->purchase_date) {
                    $purchaseDate = \Carbon\Carbon::parse($holding->purchase_date);
                } elseif ($holding->created_at) {
                    $purchaseDate = \Carbon\Carbon::parse($holding->created_at);
                } else {
                    $purchaseDate = now();
                }
            } catch (\Throwable $e) {
                $purchaseDate = now();
            }

            // Calculate purification due — only count dividends after the last purification date
            $trailingDividendsPerShare = 0;
            if ($company->dividends) {
                $trailingDividendsPerShare = $company->dividends->filter(function ($dividend) use ($latestPurificationDate, $purchaseDate) {
                    try {
                        $effectiveDate = $dividend->pay_date ? \Carbon\Carbon::parse($dividend->pay_date) :
                                      ($dividend->ex_date ? \Carbon\Carbon::parse($dividend->ex_date) : ($dividend->created_at ? \Carbon\Carbon::parse($dividend->created_at) : now()));
                        $exDate = $dividend->ex_date ? \Carbon\Carbon::parse($dividend->ex_date) : $effectiveDate;

                        if ($effectiveDate->isFuture()) return false;
                        if ($purchaseDate->copy()->startOfDay()->isAfter($exDate->copy()->startOfDay())) return false;
                        if ($latestPurificationDate && $effectiveDate->lessThanOrEqualTo($latestPurificationDate)) return false;

                        return true;
                    } catch (\Throwable $e) {
                        return false;
                    }
                })->reduce(function ($carry, $dividend) use ($exchangeRate) {
                    $amount = (float) ($dividend->amount ?? 0);
                    if (strtoupper($dividend->currency ?? 'NGN') === 'USD') {
                        $amount *= $exchangeRate;
                    }
                    return $carry + $amount;
                }, 0) ?? 0;
            }

            $totalDividendsReceived = $holding->shares * $trailingDividendsPerShare;

            if ($company->asset_class === 'mutual_fund') {
                $fundDetails = $company->fund_details ?? [];
                $history = $fundDetails['purification_history'] ?? [];
                if (!empty($history) && is_array($history)) {
                    usort($history, fn($a, $b) => ($b['year'] ?? 0) <=> ($a['year'] ?? 0));
                    $latestYear = (int) ($history[0]['year'] ?? 0);
                    $latestPerUnit = $history[0]['per_unit'] ?? 0;
                    // A fund entry is already settled if the user purified after that year began
                    $alreadyPurified = $latestPurificationDate && $latestYear > 0
                        && \Carbon\Carbon::parse($latestPurificationDate)->greaterThanOrEqualTo(\Carbon\Carbon::create($latestYear, 1, 1));
                    $purificationDue = $alreadyPurified ? 0 : $holding->shares * $latestPerUnit;
                } else {
                    $purificationDue = 0;
                }
            } else {
                $purificationDue = $totalDividendsReceived * ($nonCompliantRatio / 100);
            }

            // Nothing owed -> nothing to record. This keeps history clean, does not burn the
            // user's monthly purification quota, and makes double-submits idempotent
            // (a second request sees the first record and computes zero).
            if (round($purificationDue, 2) <= 0) continue;

            \App\Models\Purification::create([
                'user_id' => $userId,
                'symbol'  => $symbol,
                'amount'  => round($purificationDue, 2),
            ]);
            $purifiedCount++;
        }

        if ($purifiedCount > 0) {
            Cache::forget("portfolio_data_" . $userId);
            \App\Services\SubscriptionService::recordFeatureUsage($user, 'purifications_per_month');
            return $this->success(null, "Purification recorded successfully.");
        }

        return $this->success(null, "No holdings to purify.");
    }
}
