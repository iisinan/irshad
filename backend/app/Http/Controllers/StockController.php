<?php

namespace App\Http\Controllers;

use App\Events\StockStatusChanged;
use App\Models\AaoifiScreening;
use App\Models\AuditLog;
use App\Models\Company;
use App\Models\ComplianceHistory;
use App\Models\Dividend;
use App\Models\Financial;
use App\Models\FinancialScreening;
use App\Services\AaoifiComplianceService;
use App\Services\NgxService;
use App\Services\PerplexityAiService;
use App\Traits\ApiResponder;
use App\Traits\SafeCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class StockController extends Controller
{
    use ApiResponder;
    use SafeCache;

    protected NgxService $ngxService;

    protected AaoifiComplianceService $complianceService;

    public function __construct(NgxService $ngxService, AaoifiComplianceService $complianceService)
    {
        $this->ngxService = $ngxService;
        $this->complianceService = $complianceService;
    }


    public function index(): JsonResponse
    {
        $stocks = $this->safeTaggedCache(['stocks'])->remember('stocks.index', 300, function () {
            return Company::select(['id', 'name', 'symbol', 'sector', 'current_status', 'latest_price', 'price_change_pct', 'logo_url', 'market_cap', 'pe_ratio'])
                ->with('aaoifiScreening:company_id,impermissible_income_ratio')
                ->orderBy('symbol', 'asc')
                ->get()
                ->map(function ($company) {
                    $ratio = $company->aaoifiScreening ? (float) $company->aaoifiScreening->impermissible_income_ratio : 0;
                    $ratioPct = $ratio * 100;
                    $company->status = $company->current_status ? [
                        'status' => $company->current_status,
                        'purification_required' => $company->current_status === 'halal' && $ratioPct > 0,
                        'haram_revenue_percent' => round($ratioPct, 4),
                    ] : null;
                    unset($company->aaoifiScreening);

                    return $company;
                });
        });

        return $this->success($stocks);
    }

    /**
     * Fetch recent compliance changes for the dashboard feed.
     */
    public function complianceChanges(): JsonResponse
    {
        $changes = ComplianceHistory::with('company:id,symbol,name')
            ->orderBy('changed_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($change) {
                return [
                    'id' => $change->id,
                    'symbol' => $change->company->symbol,
                    'name' => $change->company->name,
                    'old_status' => $change->old_status,
                    'new_status' => $change->new_status,
                    'reason' => $change->reason,
                    'changed_at' => $change->changed_at,
                    'time_ago' => $change->changed_at->diffForHumans(),
                ];
            });

        return $this->success($changes);
    }

    /**
     * Fetch stock details by symbol.
     */
    public function show(string $symbol): JsonResponse
    {
        $fullCacheKey = "stocks.show.full.{$symbol}";

        $stockArray = $this->safeTaggedCache(['stocks'])->remember($fullCacheKey, 300, function () use ($symbol) {
            // Single eager-loaded query for company + all relations
            $company = Company::with([
                'status',
                'marketData',
                'dailyPrices' => fn ($q) => $q->orderBy('date', 'desc')->limit(30),
                'financials' => fn ($q) => $q->latest()->limit(1),
                'news' => fn ($q) => $q->latest()->limit(10),
            ])->where('symbol', $symbol)->firstOrFail();

            // Map the FinancialScreening into financials for legacy mobile app compatibility
            $existingScreening = FinancialScreening::where('company_ticker', $symbol)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($existingScreening) {
                $calc   = $existingScreening->calculation_results ?? [];
                $ratios = $calc['ratios'] ?? [];

                $simulatedFinancial = [
                    'overall_financial_pass'      => $calc['overall_financial_pass'] ?? true,
                    'interest_income_ratio'        => $ratios['non_permissible_income_ratio'] ?? 0,
                    'interest_bearing_debt_ratio'  => $ratios['interest_bearing_debt_ratio'] ?? 0,
                    'cash_and_equivalents_ratio'   => $ratios['cash_and_equivalents_ratio'] ?? 0,
                    'non_compliant_income_ratio'   => $ratios['non_permissible_income_ratio'] ?? 0,
                    'evidence_link'                => $existingScreening->evidence_links,
                    'report_quarter'               => $existingScreening->report_quarter,
                    'published_date'               => $existingScreening->published_date,
                    'financial_year'               => $existingScreening->financial_year,
                ];

                if ($company->financials && $company->financials->count() > 0) {
                    $fin = $company->financials->first();
                    foreach ($simulatedFinancial as $key => $val) {
                        $fin->$key = $val;
                    }
                } else {
                    $company->setRelation('financials', collect([new Financial($simulatedFinancial)]));
                }
            }

            $stockArray = $company->toArray();
            if ($company->marketData) {
                $stockArray = array_merge($stockArray, $company->marketData->toArray());
                unset($stockArray['market_data']);
            }
            
            // Map eps and pe_ratio to root from financials for the UI
            if ($company->financials && $company->financials->count() > 0) {
                $financial = $company->financials->first();
                $stockArray['pe_ratio'] = $stockArray['pe_ratio'] ?? $financial->pe_ratio;
                $stockArray['eps'] = $stockArray['eps'] ?? $financial->eps;
            }

            // Fetch dividends + AAOIFI in a single pass (all still inside the cache closure)
            $dividends = Dividend::where('ticker', $symbol)
                ->whereIn('status', ['upcoming', 'paid'])
                ->orderByRaw("CASE WHEN status = 'upcoming' THEN 0 ELSE 1 END, pay_date DESC")
                ->limit(5)
                ->get();

            $upcomingDividend  = $dividends->where('status', 'upcoming')->whereNotNull('ex_date')->sortBy('ex_date')->first();
            $lastPaidDividend  = $dividends->where('status', 'paid')->sortByDesc('pay_date')->first();

            $stockArray['upcoming_dividend'] = $upcomingDividend ? [
                'amount'        => $upcomingDividend->amount,
                'currency'      => $upcomingDividend->currency,
                'dividend_type' => $upcomingDividend->dividend_type,
                'ex_date'       => $upcomingDividend->ex_date?->toDateString(),
                'record_date'   => $upcomingDividend->record_date?->toDateString(),
                'pay_date'      => $upcomingDividend->pay_date?->toDateString(),
                'status'        => $upcomingDividend->status,
            ] : null;

            $stockArray['last_paid_dividend'] = $lastPaidDividend ? [
                'amount'        => $lastPaidDividend->amount,
                'currency'      => $lastPaidDividend->currency,
                'dividend_type' => $lastPaidDividend->dividend_type,
                'ex_date'       => $lastPaidDividend->ex_date?->toDateString(),
                'pay_date'      => $lastPaidDividend->pay_date?->toDateString(),
                'status'        => $lastPaidDividend->status,
            ] : null;

            // AAOIFI business_status + purification flags
            $aaoifiScreening = AaoifiScreening::where('company_id', $company->id)
                ->select('business_status', 'impermissible_income_ratio', 'impermissible_income_status')
                ->first();

            $stockArray['business_status'] = $aaoifiScreening?->business_status ?? null;

            if (isset($stockArray['status']) && is_array($stockArray['status'])) {
                $dbRatio = (float) ($aaoifiScreening?->impermissible_income_ratio ?? 0);

                if ($dbRatio == 0 && $company->financials && $company->financials->count() > 0) {
                    $financial = $company->financials->first();
                    if ($financial->total_revenue > 0) {
                        $dbRatio = ($financial->interest_income / $financial->total_revenue);
                    }
                }

                $ratioPct = $dbRatio * 100;
                $stockArray['status']['purification_required'] = ($stockArray['status']['status'] ?? '') === 'halal' && $ratioPct > 0;
                $stockArray['status']['haram_revenue_percent'] = round($ratioPct, 4);
            }

            return $stockArray;
        });

        return $this->success($stockArray);
    }



    public function search(Request $request): JsonResponse
    {
        $query = substr(trim($request->get('q', $request->get('query', ''))), 0, 100);

        $stocks = Company::select(['id', 'name', 'symbol', 'sector', 'current_status', 'latest_price', 'price_change_pct', 'logo_url'])
            ->whereNotNull('latest_price')
            ->where('latest_price', '>', 0)
            ->where(function ($q) use ($query) {
                $lowerQuery = '%' . strtolower($query) . '%';
                $q->whereRaw('LOWER(name) LIKE ?', [$lowerQuery])
                    ->orWhereRaw('LOWER(symbol) LIKE ?', [$lowerQuery]);
            })
            ->limit(20)
            ->get()->map(function ($company) {
                $company->status = $company->current_status ? ['status' => $company->current_status] : null;

                return $company;
            });

        return $this->success($stocks);
    }

    public function ngx(Request $request): JsonResponse
    {
        $allowedParams = $request->only(['status', 'sector', 'min_market_cap', 'pe_max', 'per_page', 'page']);
        // Strip out any empty/null params before hashing for deterministic cache keys
        $allowedParams = array_filter($allowedParams, fn ($v) => ! is_null($v) && $v !== '');
        ksort($allowedParams);

        $cacheKey = 'stocks.ngx_'.md5(json_encode($allowedParams));

        $stocks = $this->safeTaggedCache(['stocks'])->remember($cacheKey, 300, function () use ($request) {
            $query = Company::select([
                'id', 'name', 'symbol', 'sector', 'current_status',
                'latest_price', 'price_change', 'price_change_pct',
                'market_cap', 'pe_ratio', 'eps', 'logo_url',
            ])->orderBy('symbol', 'asc');

            if ($request->has('status') && ! empty($request->status)) {
                $statusFilters = explode(',', strtolower($request->status));
                $query->whereIn('current_status', $statusFilters);
            }

            if ($request->has('sector') && ! empty($request->sector)) {
                $sectorFilters = explode(',', strtolower($request->sector));
                $query->whereIn('sector', $sectorFilters);
            }

            if ($request->has('min_market_cap')) {
                $query->where('market_cap', '>=', (float) $request->min_market_cap);
            }

            if ($request->has('pe_max')) {
                $query->whereNotNull('pe_ratio')->where('pe_ratio', '<=', (float) $request->pe_max);
            }

            $perPage = $request->input('per_page');

            if ($perPage) {
                return $query->paginate((int) $perPage)->through(function ($company) {
                    $company->status = $company->current_status ? ['status' => $company->current_status] : null;

                    return $company;
                });
            } else {
                return $query->get()->map(function ($company) {
                    $company->status = $company->current_status ? ['status' => $company->current_status] : null;

                    return $company;
                });
            }
        });

        return $this->success($stocks);
    }

    /**
     * Run the 3-stage AAOIFI screening for a given stock using real DB data.
     * Uses AaoifiComplianceService (the authoritative engine).
     */
    public function check(string $symbol): JsonResponse
    {
        $company = Company::with(['financials' => fn ($q) => $q->latest()])->where('symbol', $symbol)->firstOrFail();

        $financials = $company->financials->first();

        if (! $financials) {
            return $this->error('No financial data available for this stock. Please wait for the next scheduled scrape.', 404);
        }

        // Use the authoritative 3-stage compliance engine
        $status = $this->complianceService->evaluateCompliance($company, $financials, $company->sector);

        $this->clearStockCaches($symbol);

        return $this->success($company->load(['status', 'financials', 'dailyPrices' => fn ($q) => $q->latest('date')->limit(1)]), 'Screening completed.');
    }

    /**
     * Scholar/Admin override for stock compliance status.
     * Requires admin or scholar role.
     */
    public function updateStatus(Request $request, string $symbol): JsonResponse
    {
        // Role check — only scholars and admins may override
        $user = auth()->user();
        if (! $user || ! in_array($user->role, ['scholar', 'admin'])) {
            return $this->error('Forbidden. Only scholars and admins may override compliance status.', 403);
        }

        $request->validate([
            'status' => 'required|in:halal,non-halal,doubtful',
            'reason' => 'nullable|string|max:500',
        ]);

        $company = Company::where('symbol', $symbol)->firstOrFail();
        $oldStatus = $company->status ? $company->status->status : null;

        $status = $company->status()->updateOrCreate(
            ['company_id' => $company->id],
            [
                'status' => $request->status,
                'reason' => 'Scholar Override'.($request->reason ? ': '.$request->reason : ''),
                'verified_by_scholar' => true,
                'last_updated' => now(),
            ]
        );

        $company->update(['current_status' => $request->status]);

        $aaoifiScreening = AaoifiScreening::where('company_id', $company->id)->latest()->first();
        if ($aaoifiScreening) {
            $aaoifiScreening->update(['final_status' => $request->status]);
        }

        ComplianceHistory::create([
            'company_id' => $company->id,
            'old_status' => $oldStatus,
            'new_status' => $request->status,
            'reason' => 'Scholar Override'.($request->reason ? ': '.$request->reason : ''),
            'changed_at' => now(),
        ]);

        // Audit log
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'override_stock_status',
            'target_type' => Company::class,
            'target_id' => $company->id,
            'changes' => [
                'old_status' => $oldStatus,
                'new_status' => $request->status,
                'reason' => $request->reason,
            ],
        ]);

        event(new StockStatusChanged($company, $status));

        $this->clearStockCaches($symbol);

        return $this->success($company->load('status'), 'Stock status updated successfully by scholar.');
    }

    /**
     * Admin override for stock AAOIFI financial data.
     */
    public function updateAaoifi(Request $request, string $symbol): JsonResponse
    {
        $request->validate([
            'market_cap' => 'nullable|numeric',
            'total_assets' => 'nullable|numeric',
            'total_revenue' => 'nullable|numeric',
            'total_debt' => 'nullable|numeric',
            'cash' => 'nullable|numeric',
            'interest_income' => 'nullable|numeric',
            'evidence_links' => 'nullable|array',
            'evidence_links.*' => 'url',
        ]);

        $company = Company::where('symbol', $symbol)->firstOrFail();

        if ($request->has('market_cap')) {
            $company->market_cap = $request->market_cap;
            $company->save();
        }

        $screening = FinancialScreening::where('company_ticker', $symbol)
            ->orderBy('created_at', 'desc')
            ->first();

        if (! $screening) {
            return $this->error('No existing screening found to override. Please run a screening first.', 404);
        }

        $chosen = $screening->chosen_values ?? [];
        $chosen['total_debt'] = ['value' => $request->total_debt, 'source' => 'Manual Admin Override'];
        $chosen['cash_and_equivalents'] = ['value' => $request->cash, 'source' => 'Manual Admin Override'];
        $chosen['interest_income'] = ['value' => $request->interest_income, 'source' => 'Manual Admin Override'];
        // Default some optional values if provided, else keep existing
        if ($request->has('total_assets')) {
            $chosen['total_assets'] = ['value' => $request->total_assets, 'source' => 'Manual Admin Override'];
        }
        if ($request->has('total_revenue')) {
            $chosen['total_revenue'] = ['value' => $request->total_revenue, 'source' => 'Manual Admin Override'];
        }

        $screening->chosen_values = $chosen;

        // Recalculate Ratios
        $calc = $screening->calculation_results ?? [];
        $ratios = $calc['ratios'] ?? [];
        $status = $calc['status'] ?? [];

        $marketCap = $company->market_cap > 0 ? $company->market_cap : 1;
        $revenue = ($chosen['total_revenue']['value'] ?? 0) > 0 ? $chosen['total_revenue']['value'] : $marketCap;

        $ratios['interest_bearing_debt_ratio'] = ($request->total_debt / $marketCap);
        $ratios['cash_and_equivalents_ratio'] = ($request->cash / $marketCap);
        $ratios['non_permissible_income_ratio'] = ($request->interest_income / $revenue);

        $status['debt_pass'] = $ratios['interest_bearing_debt_ratio'] < 0.30;
        $status['cash_pass'] = $ratios['cash_and_equivalents_ratio'] < 0.30;
        $status['income_pass'] = $ratios['non_permissible_income_ratio'] < 0.05;

        $calc['ratios'] = $ratios;
        $calc['status'] = $status;
        $calc['overall_financial_pass'] = $status['debt_pass'] && $status['cash_pass'] && $status['income_pass'];

        $screening->calculation_results = $calc;
        $screening->is_manual_override = true;
        if ($request->has('evidence_links')) {
            $screening->evidence_links = $request->evidence_links;
        }
        $screening->save();

        // Also update the financials table so normal checks see it
        $financial = Financial::where('company_id', $company->id)->latest()->first();
        if ($financial) {
            $updateData = [
                'total_debt' => $request->total_debt,
                'cash_and_equivalents' => $request->cash,
                'interest_income' => $request->interest_income,
            ];
            if ($request->has('market_cap')) {
                $updateData['market_cap'] = $request->market_cap;
            }
            if ($request->has('total_assets')) {
                $updateData['total_assets'] = $request->total_assets;
            }
            if ($request->has('total_revenue')) {
                $updateData['total_revenue'] = $request->total_revenue;
            }
            $financial->update($updateData);
        }

        // Trigger compliance re-eval (which updates the stock status on the dashboard)
        if ($financial) {
            $this->complianceService->evaluateCompliance($company, $financial, $company->sector);
        }

        $this->clearStockCaches($symbol);

        return $this->success($screening, 'Financial data updated manually.');
    }

    /**
     * Ask Perplexity AI for a Shariah analysis of the stock with confidence score and sources.
     */
    public function getAiAnalysis(string $symbol, PerplexityAiService $aiService): JsonResponse
    {
        $company = Company::with(['status', 'financials' => fn ($q) => $q->latest()])->where('symbol', $symbol)->firstOrFail();

        $statusStr = $company->status ? $company->status->status : 'unknown';
        $financials = $company->financials->first();

        $result = $aiService->analyzeCompliance($company, $financials, $statusStr);

        return $this->success([
            'reasoning' => $result['reasoning'],
            'confidence_score' => $result['confidence_score'],
            'sources' => $result['sources'],
            'analysis' => $result['reasoning'],
        ]);
    }

    /**
     * Free-form chat about a specific company's Shariah screening.
     */
    public function chatAboutStock(Request $request, string $symbol, PerplexityAiService $aiService): JsonResponse
    {
        $request->validate(['question' => 'required|string|max:500']);

        $company   = Company::where('symbol', $symbol)->firstOrFail();
        $screening = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();

        $answer = $aiService->chatAboutStock($company, $screening, $request->input('question'));

        return $this->success(['answer' => $answer]);
    }

    /**
     * Execute or retrieve the AAOIFI detailed screening for a stock.
     */
    public function aaoifiScreening(string $symbol): JsonResponse
    {
        $cacheKey = "aaoifi.screening.{$symbol}";
        $cached = $this->safeTaggedCache(['stocks'])->get($cacheKey);
        if ($cached !== null) {
            return $this->success($cached);
        }

        $company = Company::where('symbol', $symbol)->firstOrFail();

        $aaoifiScreening = AaoifiScreening::where('company_id', $company->id)->first();

        if ($aaoifiScreening) {
            $isScholarVerified = $company->status && $company->status->verified_by_scholar;
            $dbStatus = $company->status ? $company->status->status : null;
            $finalStatus = $dbStatus ?? $aaoifiScreening->final_status;

            $statusReason = null;
            $finalStage1Reason = '';
            if ($isScholarVerified) {
                $statusReason = $company->status->reason ?? 'Verified by scholar.';
                $finalStage1Reason = $company->status->reason ?? 'Verified by scholar.';
            } else {
                $bReasonRaw = $aaoifiScreening->business_reasoning;
                $businessReason = '';
                if (is_array($bReasonRaw)) {
                    $businessReason = $bReasonRaw['justification'] ?? $bReasonRaw['reason'] ?? $bReasonRaw['reasoning'] ?? $bReasonRaw['evidence'] ?? json_encode($bReasonRaw);
                } elseif (is_string($bReasonRaw)) {
                    $decoded = json_decode($bReasonRaw, true);
                    if (is_array($decoded) && (isset($decoded['justification']) || isset($decoded['reason']) || isset($decoded['reasoning']))) {
                        $businessReason = $decoded['justification'] ?? $decoded['reason'] ?? $decoded['reasoning'];
                    } else {
                        $businessReason = $bReasonRaw;
                    }
                }
                $businessReason = trim($businessReason);
                
                $finalStage1Reason = $businessReason;
                if ($aaoifiScreening->business_status === 'pass' && $finalStatus !== 'doubtful') {
                    $finalStage1Reason = 'Permissible core activity.';
                }
                $businessReason = trim($businessReason);

                if (in_array($aaoifiScreening->business_status, ['fail', 'doubtful'])) {
                    $statusReason = $businessReason ?: 'Fails qualitative business screening.';
                } elseif ($aaoifiScreening->business_status === 'pass') {
                    if ($finalStatus === 'halal') {
                        $statusReason = $businessReason ? ($businessReason.' Additionally, it passes all AAOIFI quantitative financial screening ratios.') : 'Passes both qualitative business and quantitative financial Shariah compliance checks.';
                    } else {
                        $finFails = [];
                        if ($aaoifiScreening->debt_status === 'fail') {
                            $finFails[] = 'Interest-Bearing Debt ('.round($aaoifiScreening->debt_ratio, 2).'% > 30%)';
                        }
                        if ($aaoifiScreening->cash_status === 'fail') {
                            $finFails[] = 'Cash and Equivalents ('.round($aaoifiScreening->cash_ratio, 2).'% > 30%)';
                        }
                        if ($aaoifiScreening->impermissible_income_status === 'fail') {
                            $finFails[] = 'Impermissible Income ('.round($aaoifiScreening->impermissible_income_ratio, 2).'% > 5%)';
                        }

                        $industryText = strtolower($company->industry ?? $company->sector ?? 'its sector');
                        $statusReason = "Although the company successfully passes the Shariah business activity screening because its core operations in {$industryText} are permissible, it fails to meet the required quantitative financial benchmarks.";
                    }
                } else {
                    $statusReason = 'Pending Shariah compliance screening.';
                }
            }

            $finData = $aaoifiScreening->financial_data_used ?? [];
            if (is_string($finData)) {
                $finData = json_decode($finData, true) ?? [];
            }
            $unit = $finData['unit_multiplier'] ?? 1;

            $getVal = function ($key) use ($finData, $unit) {
                if (isset($finData[$key]) && is_array($finData[$key]) && isset($finData[$key]['value'])) {
                    return $finData[$key]['value'] * $unit;
                }
                if (isset($finData[$key]) && is_numeric($finData[$key])) {
                    return $finData[$key] * $unit;
                }

                return 0;
            };

            $companyFin = $company->financials()->latest()->first();

            $frontendFinData = array_merge($finData, [
                'total_assets' => ($companyFin->total_assets ?? 0) ?: $getVal('total_assets'),
                'total_debt' => ($companyFin->total_debt ?? 0) ?: $getVal('total_debt'),
                'cash' => ($companyFin->cash_and_equivalents ?? 0) ?: $getVal('cash_and_equivalents'),
                'interest_bearing_securities' => ($companyFin->interest_bearing_securities ?? 0) ?: $getVal('interest_bearing_securities'),
                'interest_income' => ($companyFin->interest_income ?? 0) ?: $getVal('interest_income'),
                'total_revenue' => ($companyFin->total_revenue ?? 0) ?: $getVal('total_revenue'),
                'market_cap' => ($company->market_cap ?? 0) ?: ($companyFin->market_cap ?? 0),
            ]);

            $dbIncomeRatio = (float) ($aaoifiScreening->impermissible_income_ratio ?? 0);
            $incomePct = $dbIncomeRatio * 100;

            $mapped = [
                'company_id'    => $company->id,
                'company_name'  => $company->name,
                'ticker'        => $company->symbol,
                'sector'        => $company->sector,
                'industry'      => $company->industry ?? $company->sector,
                'latest_price'  => $company->latest_price,
                'market_cap'    => $company->market_cap,
                'stage1' => [
                    'status'               => $aaoifiScreening->business_status === 'pass' ? 'halal' : ($aaoifiScreening->business_status === 'doubtful' ? 'doubtful' : 'non-halal'),
                    'haram_revenue_percent'=> round($incomePct, 4),
                    'purification_required'=> $incomePct > 0 && $incomePct <= 5,
                    'reason'               => $finalStage1Reason,
                ],
                'business_status'             => $aaoifiScreening->business_status,
                'business_reasoning'          => $finalStage1Reason,
                'debt_ratio'                  => $aaoifiScreening->debt_ratio,
                'debt_status'                 => $aaoifiScreening->debt_status,
                'cash_ratio'                  => $aaoifiScreening->cash_ratio,
                'cash_status'                 => $aaoifiScreening->cash_status,
                'impermissible_income_ratio'  => $aaoifiScreening->impermissible_income_ratio,
                'impermissible_income_status' => $aaoifiScreening->impermissible_income_status,
                'illiquid_ratio'              => $aaoifiScreening->illiquid_ratio,
                'illiquid_status'             => $aaoifiScreening->illiquid_status,
                'receivables_ratio'           => $aaoifiScreening->receivables_ratio,
                'receivables_status'          => $aaoifiScreening->receivables_status,
                'final_status'                => $finalStatus,
                'published_date'              => $aaoifiScreening->published_date,
                'reporting_period'            => $aaoifiScreening->reporting_period,
                'reporting_year'              => $aaoifiScreening->reporting_year,
                'news_sources'                => $aaoifiScreening->news_sources ?? [],
                'financial_data_used'         => $frontendFinData,
                'ai_explanation'              => $aaoifiScreening->business_reasoning ?? $company->activity_reason,
                'status_reason'               => $statusReason,
            ];

            $this->safeTaggedCache(['stocks'])->put($cacheKey, $mapped, 300);

            return $this->success($mapped);
        }

        return response()->json([
            'status' => 'processing',
            'message' => 'Screening is currently running in the background. Please check back in a few minutes.',
        ], 202);
    }
}
