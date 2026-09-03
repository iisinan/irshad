<?php

namespace App\Http\Controllers;

use App\Models\BrokerageAccount;
use App\Models\Company;
use App\Models\Holding;
use App\Models\PortfolioSnapshot;
use App\Models\Watchlist;
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
            $holdings = Holding::with([
                'company.financials:id,company_id,total_revenue,interest_income',
                'company.aaoifiScreening:id,company_id,impermissible_income_ratio',
                'company.latestDividend',
                'company.dividends' => function ($query) {
                    $query->whereIn('status', ['paid', 'upcoming', 'declared'])
                        ->where('pay_date', '>=', now()->subMonths(12));
                },
            ])
                ->where('user_id', $userId)
                ->get();

            $portfolioData = $holdings->map(function ($holding) use ($userId) {
                $company = $holding->company;
                $currentPrice = (float) ($company->latest_price ?? 0);
                $status = $company->current_status ?? 'doubtful';

                $screening = $company?->aaoifiScreening;
                $nonCompliantRatio = $screening?->impermissible_income_ratio ?? 0;

                $totalValue = $holding->shares * $currentPrice;

                $isHalal = strtolower($status) === 'halal' || strtolower($status) === 'compliant';

                // Fetch latest purification date for this symbol
                $latestPurificationDate = \App\Models\Purification::where('user_id', $userId)
                    ->where('symbol', $holding->symbol)
                    ->latest()
                    ->value('created_at');

                // Calculate Purification Due based on paid dividends in the trailing 12 months,
                // but only count dividends paid AFTER the latest purification date.
                $trailingDividendsPerShare = $company?->dividends?->filter(function ($dividend) use ($latestPurificationDate) {
                    if (!$latestPurificationDate) return true;
                    // If no pay_date, fallback to ex_date or created_at
                    $dividendDt = $dividend->pay_date ? \Carbon\Carbon::parse($dividend->pay_date) : 
                                  ($dividend->ex_date ? \Carbon\Carbon::parse($dividend->ex_date) : $dividend->created_at);
                    return $dividendDt->isAfter($latestPurificationDate);
                })->reduce(function ($carry, $dividend) {
                    $amount = $dividend->amount;
                    if (strtoupper($dividend->currency) === 'USD') {
                        $amount *= 1370; // Approximate USD to NGN rate
                    }
                    return $carry + $amount;
                }, 0) ?? 0;
                
                $totalDividendsReceived = $holding->shares * $trailingDividendsPerShare;
                $purificationDue = $isHalal ? $totalDividendsReceived * ($nonCompliantRatio / 100) : 0;

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
                    'is_halal' => $isHalal,
                    'purification_due' => round($purificationDue, 2),
                    'total_dividends' => round($totalDividendsReceived, 2),
                    'latest_dividend' => $company->latestDividend ? [
                        'amount' => $company->latestDividend->amount,
                        'pay_date' => $company->latestDividend->pay_date?->toISOString(),
                        'status' => $company->latestDividend->status,
                    ] : null,
                    'non_compliant_ratio' => round($nonCompliantRatio, 2),
                    'logo_url' => $company->logo_url ?? null,
                    'purchase_date' => $holding->purchase_date,
                    'created_at' => $holding->created_at?->toISOString(),
                    'updated_at' => $holding->updated_at?->toISOString(),
                ];
            });

            // Get Brokerage Cash
            $brokerage = BrokerageAccount::where('user_id', $userId)->first();
            $cashBalance = $brokerage?->cash_balance ?? 0.0;

            // Summary
            $stocksBalance = $portfolioData->sum('total_value');
            $totalBalance = $stocksBalance + $cashBalance;
            $totalPurification = $portfolioData->sum('purification_due');

            $halalValue = $portfolioData->where('is_halal', true)->sum('total_value');
            $healthPercentage = $stocksBalance > 0 ? round(($halalValue / $stocksBalance) * 100, 1) : 100;

            // Fetch trailing 30 days of history
            $history = PortfolioSnapshot::where('user_id', $userId)
                ->where('date', '>=', now()->subDays(30)->toDateString())
                ->orderBy('date', 'asc')
                ->get(['date', 'total_balance as value']);

            // If today isn't in history yet, append current balance
            if ($history->isEmpty() || $history->last()->date->toDateString() !== now()->toDateString()) {
                $history->push([
                    'date' => now()->toDateString(),
                    'value' => $totalBalance,
                ]);
            }

            // Fetch purifications history
            $purifications = \App\Models\Purification::where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();

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

        Cache::forget("portfolio_data_" . Auth::id());

        return $this->success($holding, 'Holding added to portfolio successfully.');
    }

    public function update(Request $request, $id): JsonResponse
    {
        $request->validate([
            'shares' => 'required|numeric|min:0',
            'average_buy_price' => 'required|numeric|min:0',
        ]);

        $holding = Holding::where('user_id', Auth::id())->where('id', $id)->first();

        if (! $holding) {
            return $this->error('Holding not found', 404);
        }

        $holding->update([
            'shares' => $request->shares,
            'average_buy_price' => $request->average_buy_price,
        ]);

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
            'holdings.*.symbol' => 'required|string|exists:companies,symbol',
            'holdings.*.shares' => 'required|numeric|min:0.01',
            'holdings.*.average_buy_price' => 'nullable|numeric|min:0',
            'holdings.*.purchase_date' => 'nullable|date',
        ]);

        $userId = Auth::id();
        $upsertData = [];

        foreach ($request->holdings as $holdingData) {
            $upsertData[] = [
                'user_id' => $userId,
                'symbol' => strtoupper($holdingData['symbol']),
                'shares' => $holdingData['shares'],
                'average_buy_price' => $holdingData['average_buy_price'] ?? null,
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
                          ->where('pay_date', '>=', now()->subMonths(12));
                },
            ])->where('symbol', $symbol)->first();
            if (!$company) continue;

            $status = $company->current_status ?? 'doubtful';
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

            // Calculate purification due — only count dividends after the last purification date
            $trailingDividendsPerShare = $company->dividends->filter(function ($dividend) use ($latestPurificationDate) {
                if (!$latestPurificationDate) return true;
                $dividendDt = $dividend->pay_date ? \Carbon\Carbon::parse($dividend->pay_date) :
                              ($dividend->ex_date ? \Carbon\Carbon::parse($dividend->ex_date) : $dividend->created_at);
                return $dividendDt->isAfter($latestPurificationDate);
            })->reduce(function ($carry, $dividend) {
                $amount = $dividend->amount;
                if (strtoupper($dividend->currency) === 'USD') {
                    $amount *= 1370;
                }
                return $carry + $amount;
            }, 0) ?? 0;

            $totalDividendsReceived = $holding->shares * $trailingDividendsPerShare;
            $purificationDue = $totalDividendsReceived * ($nonCompliantRatio / 100);

            // Always create a purification record, even if amount is 0.
            // This acts as a timestamp marker so the stock disappears from the
            // purification tab and does not reappear until new dividends are paid.
            \App\Models\Purification::create([
                'user_id' => $userId,
                'symbol'  => $symbol,
                'amount'  => round($purificationDue, 2),
            ]);
            $purifiedCount++;
        }

        if ($purifiedCount > 0) {
            Cache::forget("portfolio_data_" . $userId);
            return $this->success(null, "Purification recorded successfully.");
        }

        return $this->success(null, "No holdings to purify.");
    }
}
