<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\InstitutionalPortfolio;
use App\Services\StatementParserService;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InstitutionController extends Controller
{
    use ApiResponder;

    /**
     * Ticker aliases commonly seen in institutional Excel/CSV/custodian exports.
     */
    protected array $tickerAliases = [
        'WAPCO' => 'HBMNG',
        'LAFARGE' => 'HBMNG',
        'LAFARGE AFRICA' => 'HBMNG',
        'LAFARGE AFRICA PLC' => 'HBMNG',
        'HBMNG' => 'HBMNG',
        'ARADEL' => 'ARADEL',
        'ARADEL HOLDINGS' => 'ARADEL',
        'ARADEL HOLDINGS PLC' => 'ARADEL',
        'BUACEMENT' => 'BUACEMENT',
        'BUA CEMENT' => 'BUACEMENT',
        'BUA CEMENT PLC' => 'BUACEMENT',
        'BUAFOODS' => 'BUAFOODS',
        'BUA FOODS' => 'BUAFOODS',
        'BUA FOODS PLC' => 'BUAFOODS',
        'CADBURY' => 'CADBURY',
        'CADBURY NIGERIA' => 'CADBURY',
        'CADBURY NIGERIA PLC' => 'CADBURY',
        'CAP' => 'CAP',
        'CAP PLC' => 'CAP',
        'CHEMICAL AND ALLIED PRODUCTS' => 'CAP',
        'CHEMICAL AND ALLIED PRODUCTS PLC' => 'CAP',
        'DANGCEM' => 'DANGCEM',
        'DANGOTE CEMENT' => 'DANGCEM',
        'DANGOTE CEMENT PLC' => 'DANGCEM',
        'JAIZBANK' => 'JAIZBANK',
        'JAIZ BANK' => 'JAIZBANK',
        'JAIZ BANK PLC' => 'JAIZBANK',
        'MTNN' => 'MTNN',
        'MTN' => 'MTNN',
        'MTN NIGERIA' => 'MTNN',
        'MTN NIGERIA COMMUNICATIONS' => 'MTNN',
        'MTN NIGERIA COMMUNICATIONS PLC' => 'MTNN',
        'NESTLE' => 'NESTLE',
        'NESTLE NIGERIA' => 'NESTLE',
        'NESTLE NIGERIA PLC' => 'NESTLE',
        'NAHCO' => 'NAHCO',
        'NIGERIAN AVIATION HANDLING COMPANY' => 'NAHCO',
        'NIGERIAN AVIATION HANDLING COMPANY PLC' => 'NAHCO',
        'OKOMUOIL' => 'OKOMUOIL',
        'OKOMU' => 'OKOMUOIL',
        'OKOMU OIL' => 'OKOMUOIL',
        'OKOMU OIL PALM' => 'OKOMUOIL',
        'OKOMU OIL PLC' => 'OKOMUOIL',
        'PRESCO' => 'PRESCO',
        'PRESCO PLC' => 'PRESCO',
        'NASCON' => 'NASCON',
        'NASCON ALLIED INDUSTRIES' => 'NASCON',
        'LOTUSHAL15' => 'LOTUSHAL15',
        'ZENITHBANK' => 'ZENITHBANK',
        'ZENITH BANK' => 'ZENITHBANK',
        'GTCO' => 'GTCO',
        'NB' => 'NB',
        'NIGERIAN BREWERIES' => 'NB',
        'ACCESSCORP' => 'ACCESSCORP',
        'SEPLAT' => 'SEPLAT',
        'AIRTELAFRI' => 'AIRTELAFRI',
        'UBA' => 'UBA',
    ];

    protected function buildLotusPreset(): array
    {
        // Lotus Halal Equity ETF 13 constituent holdings (from July 2026 Fact Sheet)
        $lotusConstituents = [
            ['symbol' => 'DANGCEM',   'label' => 'Dangote Cement PLC',                     'sector' => 'Industrial Goods',   'target_weight' => 17.50, 'shares' => 380000],
            ['symbol' => 'BUACEMENT', 'label' => 'BUA Cement PLC',                         'sector' => 'Industrial Goods',   'target_weight' => 11.20, 'shares' => 1195000],
            ['symbol' => 'HBMNG',     'label' => 'Lafarge Africa PLC (HBMNG)',             'sector' => 'Industrial Goods',   'target_weight' => 4.20,  'shares' => 410000],
            ['symbol' => 'CAP',       'label' => 'Chemical and Allied Products PLC',       'sector' => 'Industrial Goods',   'target_weight' => 2.17,  'shares' => 627000],
            ['symbol' => 'ARADEL',    'label' => 'Aradel Holdings PLC',                    'sector' => 'Oil & Gas',          'target_weight' => 18.68, 'shares' => 458000],
            ['symbol' => 'BUAFOODS',  'label' => 'BUA Foods PLC',                          'sector' => 'Consumer Goods',     'target_weight' => 9.85,  'shares' => 412000],
            ['symbol' => 'NESTLE',    'label' => 'Nestlé Nigeria Plc',                     'sector' => 'Consumer Goods',     'target_weight' => 3.12,  'shares' => 37500],
            ['symbol' => 'CADBURY',   'label' => 'Cadbury Nigeria Plc',                    'sector' => 'Consumer Goods',     'target_weight' => 1.62,  'shares' => 904000],
            ['symbol' => 'MTNN',      'label' => 'MTN Nigeria Communications PLC',         'sector' => 'Telecommunications', 'target_weight' => 14.39, 'shares' => 547000],
            ['symbol' => 'OKOMUOIL',  'label' => 'Okomu Oil PLC',                          'sector' => 'Agriculture',        'target_weight' => 7.15,  'shares' => 200000],
            ['symbol' => 'PRESCO',    'label' => 'Presco PLC',                             'sector' => 'Agriculture',        'target_weight' => 6.54,  'shares' => 125500],
            ['symbol' => 'NAHCO',     'label' => 'Nigerian Aviation Handling Company PLC', 'sector' => 'Aviation',           'target_weight' => 2.32,  'shares' => 542000],
            ['symbol' => 'JAIZBANK',  'label' => 'Jaiz Bank PLC',                          'sector' => 'Banking',            'target_weight' => 1.25,  'shares' => 5600000],
        ];

        $lotusScreened = $this->evaluateHoldingsArray($lotusConstituents);
        $removedNascon = $this->evaluateHoldingsArray([
            ['symbol' => 'NASCON', 'label' => 'Nascon Allied Industries Plc (Removed Jun 30, 2026)', 'sector' => 'Consumer Goods', 'shares' => 250000],
        ]);

        return [
            'id' => 'lotus_etf',
            'institution_name' => 'Lotus Capital Limited',
            'fund_name' => 'Lotus Halal Equity Exchange Traded Fund',
            'short_name' => 'LHE ETF',
            'ticker' => 'LOTUSHAL15',
            'bloomberg_ticker' => 'LOTCHLAL:NL',
            'isin' => 'NGLOTUSHAL13',
            'factsheet_date' => '3rd July, 2026',
            'fund_size_label' => '₦3.18billion',
            'fund_size_ngn' => 3180000000,
            'nav_per_unit' => 95.17,
            'closing_price' => 127.90,
            'purification_per_unit_fy25' => 0.46,
            'last_distribution' => 'December 2025: ₦0.81/unit',
            'management_fee' => '0.60%',
            'rebalancing_frequency' => 'Half-Yearly',
            'last_rebalancing' => '30th June, 2026',
            'next_rebalancing' => '31st December, 2026',
            'benchmark_index' => 'NGX Lotus Islamic Index (NGXLII)',
            'launch_date' => 'Aug-14',
            'listing_date' => 'Nov-14',
            'screening_result' => $lotusScreened,
            'rebalance_removed' => $removedNascon['holdings'][0] ?? null,
        ];
    }

    protected function buildNorrenbergerPreset(): array
    {
        return [
            'id' => 'norrenberger_fund',
            'institution_name' => 'Norrenberger Asset Management Limited',
            'fund_name' => 'Norrenberger Islamic Fund',
            'factsheet_date' => 'October 2026',
            'ytd_yield' => 17.72,
            'unit_price' => 108.27,
            'fund_size_label' => '₦6.81bn',
            'fund_size_ngn' => 6810000000,
            'expense_ratio' => '1.90%',
            'management_fee' => '1.50% p.a.',
            'launch_date' => 'May 2021',
            'status' => 'Open Ended',
            'bias' => 'Fixed Income',
            'listed' => 'NGX',
            'initial_investment' => '50 Units',
            'additional_investment' => '10 Units',
            'benchmark' => '3-year FGN Sukuk (Moving Average)',
            'risk_profile' => 'Conservative',
            'allocation' => [
                ['security' => 'Federal Government Sukuk', 'current' => 21.79, 'target_min' => 30, 'target_max' => 100, 'target_label' => '30% - 100%', 'shariah_contract' => 'Sukuk Al-Ijarah', 'status' => 'Below Target Band'],
                ['security' => 'Mudarabah',                'current' => 43.99, 'target_min' => 0,  'target_max' => 70,  'target_label' => '0% - 70%',   'shariah_contract' => 'Profit-Sharing',   'status' => 'Within Mandate'],
                ['security' => 'Ijarah/Wakalah',           'current' => 7.23,  'target_min' => 0,  'target_max' => 50,  'target_label' => '0% - 50%',   'shariah_contract' => 'Leasing / Agency', 'status' => 'Within Mandate'],
                ['security' => 'Murabaha',                 'current' => 25.34, 'target_min' => 0,  'target_max' => 50,  'target_label' => '0% - 50%',   'shariah_contract' => 'Cost-Plus Trade',  'status' => 'Within Mandate'],
                ['security' => 'Cash',                     'current' => 1.64,  'target_min' => 0,  'target_max' => 15,  'target_label' => '0% - 15%',   'shariah_contract' => 'Non-Interest Cash','status' => 'Within Mandate'],
            ],
        ];
    }

    /**
     * Tenant-isolated institutional workspace payload.
     * Ensures logged-in institutions only see their own funds and saved mandates.
     */
    public function workspace(Request $request): JsonResponse
    {
        $user = $request->user();
        $identity = strtolower(trim(($user->institution_name ?? '') . ' ' . ($user->email ?? '')));
        $isAdmin = $user->role === 'admin';

        $tenantKey = 'custom';
        if ($isAdmin) {
            $tenantKey = 'admin';
        } elseif (str_contains($identity, 'lotus')) {
            $tenantKey = 'lotus';
        } elseif (str_contains($identity, 'norrenberger')) {
            $tenantKey = 'norrenberger';
        }

        $savedPortfolios = InstitutionalPortfolio::where('user_id', $user->id)
            ->orderByDesc('updated_at')
            ->get()
            ->map(function ($p) {
                $screened = $this->evaluateHoldingsArray($p->holdings_payload ?? []);
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'fund_code' => $p->fund_code,
                    'benchmark' => $p->benchmark,
                    'currency' => $p->currency,
                    'holdings_payload' => $p->holdings_payload,
                    'factsheet_meta' => $p->factsheet_meta,
                    'screened' => $screened,
                    'updated_at' => $p->updated_at,
                ];
            });

        $payload = [
            'tenant_key' => $tenantKey,
            'institution_name' => $user->institution_name ?: $user->name,
            'institution_type' => $user->institution_type ?: 'Institutional Partner',
            'saved_portfolios' => $savedPortfolios,
            'lotus_etf' => null,
            'norrenberger_fund' => null,
        ];

        if ($tenantKey === 'lotus' || $isAdmin) {
            $payload['lotus_etf'] = $this->buildLotusPreset();
        }
        if ($tenantKey === 'norrenberger' || $isAdmin) {
            $payload['norrenberger_fund'] = $this->buildNorrenbergerPreset();
        }

        return $this->success($payload);
    }

    /**
     * Public-safe institutional demo presets backed by live DB screening data.
     * Powers boardroom presentations & live demos for Lotus Capital & Norrenberger.
     */
    public function demoPresets(): JsonResponse
    {
        // Sample mixed institutional brokerage / bank book (demonstrates flagging non-compliant positions)
        $mixedBook = $this->evaluateHoldingsArray([
            ['symbol' => 'DANGCEM',    'shares' => 120000],
            ['symbol' => 'MTNN',       'shares' => 180000],
            ['symbol' => 'ARADEL',     'shares' => 95000],
            ['symbol' => 'BUAFOODS',   'shares' => 140000],
            ['symbol' => 'SEPLAT',     'shares' => 15000],
            ['symbol' => 'PRESCO',     'shares' => 65000],
            ['symbol' => 'JAIZBANK',   'shares' => 2500000],
            ['symbol' => 'NASCON',     'shares' => 300000],
            ['symbol' => 'ZENITHBANK', 'shares' => 850000],
            ['symbol' => 'NB',         'shares' => 420000],
        ]);

        return $this->success([
            'lotus_etf' => $this->buildLotusPreset(),
            'norrenberger_fund' => $this->buildNorrenbergerPreset(),
            'mixed_institutional_book' => $mixedBook,
        ]);
    }

    /**
     * Screen any uploaded portfolio document (CSV/XLSX/PDF/DOCX/ODS/JSON/HTML/Image/Text),
     * pasted raw text blotter, or JSON holdings array against Irshad's live AAOIFI database.
     */
    public function screenPortfolio(Request $request, StatementParserService $parser): JsonResponse
    {
        $rows = [];
        $sourceLabel = 'Manual / JSON Portfolio';
        $brokerDetected = null;
        $detectedFormat = 'json';
        $detectedFormatLabel = 'Structured Portfolio Payload';
        $extractionMethod = 'deterministic';

        if ($request->hasFile('file') || $request->hasFile('statement')) {
            $file = $request->file('file') ?? $request->file('statement');
            $request->validate([
                'file' => 'nullable|file|max:15360',
                'statement' => 'nullable|file|max:15360',
                'password' => 'nullable|string',
            ]);

            $sourceLabel = $file->getClientOriginalName();
            $detection = $parser->detectDocumentFormat(
                $file->getRealPath(),
                $sourceLabel,
                $file->getMimeType() ?: $file->getClientMimeType()
            );
            $detectedFormat = $detection['format'];
            $detectedFormatLabel = $detection['label'];

            // Fast deterministic institutional CSV shortcut when file actually looks like delimited text
            if (in_array($detectedFormat, ['csv', 'tsv'], true)) {
                $rows = $this->parseInstitutionalCsv($file->getRealPath());
                $brokerDetected = $detectedFormat === 'tsv' ? 'TSV Statement' : 'CSV Portfolio';
            }

            if (empty($rows)) {
                $parsed = $parser->parse($file, $request->input('password'));
                if (! empty($parsed['password_required'])) {
                    return response()->json([
                        'status' => 'password_required',
                        'detected_format' => $parsed['detected_format'] ?? $detectedFormat,
                        'detected_format_label' => $parsed['detected_format_label'] ?? $detectedFormatLabel,
                        'message' => $parsed['message'] ?? 'This document is password protected.',
                    ], 200);
                }

                $detectedFormat = $parsed['detected_format'] ?? $detectedFormat;
                $detectedFormatLabel = $parsed['detected_format_label'] ?? $detectedFormatLabel;
                $extractionMethod = $parsed['extraction_method'] ?? $extractionMethod;
                $brokerDetected = $parsed['broker'] ?? null;

                $rows = collect($parsed['holdings'] ?? [])->map(fn ($h) => [
                    'symbol' => $h['symbol'] ?? $h['ticker'] ?? '',
                    'shares' => (float) ($h['shares'] ?? $h['units'] ?? $h['quantity'] ?? 0),
                    'avg_price' => isset($h['average_buy_price']) ? (float) $h['average_buy_price'] : null,
                    'label' => $h['company_name'] ?? $h['name'] ?? null,
                ])->toArray();
            }
        } elseif ($request->filled('raw_text')) {
            $request->validate([
                'raw_text' => 'required|string|max:200000',
            ]);
            $parsed = $parser->parseRawText((string) $request->input('raw_text'));
            $sourceLabel = 'Pasted Institutional Blotter';
            $detectedFormat = $parsed['detected_format'] ?? 'text';
            $detectedFormatLabel = $parsed['detected_format_label'] ?? 'Pasted Text / Blotter';
            $extractionMethod = $parsed['extraction_method'] ?? 'deterministic';
            $brokerDetected = $parsed['broker'] ?? null;

            $rows = collect($parsed['holdings'] ?? [])->map(fn ($h) => [
                'symbol' => $h['symbol'] ?? $h['ticker'] ?? '',
                'shares' => (float) ($h['shares'] ?? $h['units'] ?? $h['quantity'] ?? 0),
                'avg_price' => isset($h['average_buy_price']) ? (float) $h['average_buy_price'] : null,
                'label' => $h['company_name'] ?? $h['name'] ?? null,
            ])->toArray();
        } else {
            $request->validate([
                'holdings' => 'required|array|min:1',
                'holdings.*.symbol' => 'required|string|max:64',
                'holdings.*.shares' => 'required|numeric|min:0',
            ]);
            $rows = $request->input('holdings', []);
        }

        if (empty($rows)) {
            return $this->error(
                "Detected {$detectedFormatLabel}, but could not find any recognizable stock positions or share quantities inside it.",
                422
            );
        }

        $result = $this->evaluateHoldingsArray($rows);
        $result['source_label'] = $sourceLabel;
        $result['detected_format'] = $detectedFormat;
        $result['detected_format_label'] = $detectedFormatLabel;
        $result['extraction_method'] = $extractionMethod;
        if ($brokerDetected) {
            $result['broker_detected'] = $brokerDetected;
        }

        return $this->success($result, 'Institutional portfolio screened successfully.');
    }

    /**
     * List saved portfolios for the authenticated institutional account.
     */
    public function portfolios(): JsonResponse
    {
        $items = InstitutionalPortfolio::where('user_id', Auth::id())
            ->orderByDesc('updated_at')
            ->get();

        return $this->success($items);
    }

    /**
     * Save or update a screened institutional portfolio for persistent workspace & factsheet generation.
     */
    public function savePortfolio(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => 'nullable|integer',
            'name' => 'required|string|max:180',
            'fund_code' => 'nullable|string|max:40',
            'benchmark' => 'nullable|string|max:120',
            'currency' => 'nullable|string|max:10',
            'holdings_payload' => 'required|array|min:1',
            'factsheet_meta' => 'nullable|array',
        ]);

        $evaluated = $this->evaluateHoldingsArray($validated['holdings_payload']);

        if (! empty($validated['id'])) {
            $portfolio = InstitutionalPortfolio::where('user_id', Auth::id())
                ->findOrFail($validated['id']);
            $portfolio->update([
                'name' => $validated['name'],
                'fund_code' => $validated['fund_code'] ?? $portfolio->fund_code,
                'benchmark' => $validated['benchmark'] ?? $portfolio->benchmark,
                'currency' => $validated['currency'] ?? $portfolio->currency,
                'holdings_payload' => $validated['holdings_payload'],
                'summary_snapshot' => $evaluated['summary'],
                'factsheet_meta' => $validated['factsheet_meta'] ?? $portfolio->factsheet_meta,
            ]);
        } else {
            $portfolio = InstitutionalPortfolio::create([
                'user_id' => Auth::id(),
                'name' => $validated['name'],
                'fund_code' => $validated['fund_code'] ?? null,
                'benchmark' => $validated['benchmark'] ?? 'NGX Lotus Islamic Index (NGXLII)',
                'currency' => $validated['currency'] ?? 'NGN',
                'holdings_payload' => $validated['holdings_payload'],
                'summary_snapshot' => $evaluated['summary'],
                'factsheet_meta' => $validated['factsheet_meta'] ?? [],
            ]);
        }

        return $this->success([
            'portfolio' => $portfolio,
            'screened' => $evaluated,
        ], 'Institutional portfolio saved.');
    }

    public function deletePortfolio(int $id): JsonResponse
    {
        $portfolio = InstitutionalPortfolio::where('user_id', Auth::id())->findOrFail($id);
        $portfolio->delete();

        return $this->success(null, 'Institutional portfolio deleted.');
    }

    /**
     * Evaluate a list of holdings against live Company, AaoifiScreening, and Dividend tables.
     */
    public function evaluateHoldingsArray(array $rows): array
    {
        $normalizedRows = [];
        $symbolsNeeded = [];

        foreach ($rows as $row) {
            $rawSymbol = strtoupper(trim((string) ($row['symbol'] ?? $row['ticker'] ?? '')));
            if ($rawSymbol === '') {
                continue;
            }
            $resolvedSymbol = $this->tickerAliases[$rawSymbol] ?? $rawSymbol;
            $symbolsNeeded[$resolvedSymbol] = true;
            $normalizedRows[] = array_merge($row, [
                'input_symbol' => $rawSymbol,
                'resolved_symbol' => $resolvedSymbol,
            ]);
        }

        $companies = Company::with([
            'aaoifiScreening',
            'latestDividend',
            'dividends' => function ($q) {
                $q->whereIn('status', ['paid', 'upcoming', 'declared'])
                    ->where(function ($sub) {
                        $sub->where('pay_date', '>=', now()->subMonths(12))
                            ->orWhereNull('pay_date');
                    });
            },
        ])->whereIn('symbol', array_keys($symbolsNeeded))
            ->get()
            ->keyBy(fn ($c) => strtoupper($c->symbol));

        $evaluated = [];
        $totalAum = 0.0;
        $compliantAum = 0.0;
        $doubtfulAum = 0.0;
        $nonCompliantAum = 0.0;
        $unmappedAum = 0.0;
        $totalPurification = 0.0;
        $compliantCount = 0;
        $nonCompliantCount = 0;
        $doubtfulCount = 0;
        $purifyRequiredCount = 0;
        $sectorTotals = [];

        foreach ($normalizedRows as $row) {
            $sym = $row['resolved_symbol'];
            $company = $companies->get($sym);
            $shares = max(0.0, (float) ($row['shares'] ?? $row['units'] ?? 0));
            $avgPrice = isset($row['avg_price']) ? (float) $row['avg_price'] : null;

            if (! $company) {
                $fallbackPrice = $avgPrice ?? 0.0;
                $mv = $shares * $fallbackPrice;
                $totalAum += $mv;
                $unmappedAum += $mv;
                $sectorName = $row['sector'] ?? 'Unclassified';
                $sectorTotals[$sectorName] = ($sectorTotals[$sectorName] ?? 0) + $mv;

                $evaluated[] = [
                    'symbol' => $sym,
                    'input_symbol' => $row['input_symbol'],
                    'name' => $row['label'] ?? $sym,
                    'sector' => $sectorName,
                    'shares' => $shares,
                    'current_price' => $fallbackPrice,
                    'market_value' => round($mv, 2),
                    'status' => 'unmapped',
                    'is_halal' => false,
                    'purification_required' => false,
                    'purification_per_unit' => 0,
                    'purification_due' => 0,
                    'impure_ratio' => 0,
                    'debt_ratio' => null,
                    'cash_ratio' => null,
                    'trailing_dividend_per_share' => 0,
                    'total_dividends' => 0,
                    'reporting_period' => null,
                    'business_summary' => 'Ticker not yet matched to an NGX listed issuer in Irshad.',
                    'is_near_threshold' => false,
                    'target_weight' => $row['target_weight'] ?? null,
                ];
                continue;
            }

            $price = (float) ($company->latest_price ?? 0);
            if ($price <= 0 && $avgPrice && $avgPrice > 0) {
                $price = $avgPrice;
            }

            $mv = $shares * $price;
            $screening = $company->aaoifiScreening;
            $rawStatus = strtolower((string) ($company->current_status ?? $screening?->final_status ?? 'doubtful'));
            $isHalal = in_array($rawStatus, ['halal', 'compliant'], true);
            $isNonCompliant = in_array($rawStatus, ['non-compliant', 'non_compliant', 'non-halal', 'non_halal'], true);

            $debtRatio = $screening ? round((float) $screening->debt_ratio, 2) : null;
            $cashRatio = $screening ? round((float) $screening->cash_ratio, 2) : null;
            $impureRatio = $screening ? round((float) $screening->impermissible_income_ratio, 4) : 0.0;

            $trailingDivPerShare = 0.0;
            if ($company->dividends && $company->dividends->isNotEmpty()) {
                $trailingDivPerShare = (float) $company->dividends->filter(function ($d) {
                    try {
                        $dt = $d->pay_date ?? $d->ex_date ?? $d->created_at;
                        return $dt ? ! \Carbon\Carbon::parse($dt)->isFuture() : true;
                    } catch (\Throwable $e) {
                        return false;
                    }
                })->sum('amount');
            }
            if ($trailingDivPerShare <= 0 && $company->latestDividend) {
                $trailingDivPerShare = (float) ($company->latestDividend->amount ?? 0);
            }

            $purificationPerUnit = 0.0;
            if ($company->asset_class === 'mutual_fund') {
                $history = $company->fund_details['purification_history'] ?? [];
                if (! empty($history) && is_array($history)) {
                    usort($history, fn ($a, $b) => ($b['year'] ?? 0) <=> ($a['year'] ?? 0));
                    $purificationPerUnit = (float) ($history[0]['per_unit'] ?? 0);
                }
            } elseif ($isHalal && $impureRatio > 0 && $trailingDivPerShare > 0) {
                $purificationPerUnit = $trailingDivPerShare * ($impureRatio / 100);
            }

            $totalDividends = $shares * $trailingDivPerShare;
            $purificationDue = $isHalal ? ($shares * $purificationPerUnit) : 0.0;
            $purificationRequired = $isHalal && ($impureRatio > 0 || $purificationDue > 0);

            if ($isHalal) {
                $compliantAum += $mv;
                $compliantCount++;
            } elseif ($isNonCompliant) {
                $nonCompliantAum += $mv;
                $nonCompliantCount++;
            } else {
                $doubtfulAum += $mv;
                $doubtfulCount++;
            }

            if ($purificationRequired) {
                $purifyRequiredCount++;
            }

            $totalAum += $mv;
            $totalPurification += $purificationDue;

            $sectorLabel = ucwords(strtolower(trim((string) ($row['sector'] ?? ($company->sector ?: 'Equities')))));
            $sectorTotals[$sectorLabel] = ($sectorTotals[$sectorLabel] ?? 0) + $mv;

            $bizSummary = is_array($screening?->business_reasoning)
                ? ($screening->business_reasoning['summary'] ?? $company->activity_reason ?? null)
                : ($company->activity_reason ?? null);

            $isNearThreshold = $isHalal && (
                ($debtRatio !== null && $debtRatio >= 25.0) ||
                ($cashRatio !== null && $cashRatio >= 25.0) ||
                $impureRatio >= 4.0
            );

            $evaluated[] = [
                'symbol' => $company->symbol,
                'input_symbol' => $row['input_symbol'],
                'name' => $row['label'] ?? $company->name,
                'sector' => $sectorLabel,
                'shares' => $shares,
                'current_price' => round($price, 2),
                'price_change_pct' => (float) ($company->price_change_pct ?? 0),
                'market_value' => round($mv, 2),
                'market_cap' => (float) ($company->market_cap ?? 0),
                'status' => $isHalal ? 'halal' : ($isNonCompliant ? 'non-compliant' : 'doubtful'),
                'is_halal' => $isHalal,
                'purification_required' => $purificationRequired,
                'purification_per_unit' => round($purificationPerUnit, 4),
                'purification_due' => round($purificationDue, 2),
                'impure_ratio' => round($impureRatio, 2),
                'debt_ratio' => $debtRatio,
                'cash_ratio' => $cashRatio,
                'trailing_dividend_per_share' => round($trailingDivPerShare, 4),
                'total_dividends' => round($totalDividends, 2),
                'reporting_period' => trim(($screening?->reporting_period ?? '') . ' ' . ($screening?->reporting_year ?? '')),
                'source_url' => $screening?->financial_data_used['source_url'] ?? null,
                'business_summary' => $bizSummary,
                'is_near_threshold' => $isNearThreshold,
                'target_weight' => $row['target_weight'] ?? null,
                'logo_url' => $company->logo_url,
            ];
        }

        // Compute weights
        foreach ($evaluated as &$item) {
            $item['weight_pct'] = $totalAum > 0
                ? round(($item['market_value'] / $totalAum) * 100, 2)
                : ($item['target_weight'] ?? 0);
        }
        unset($item);

        // Sort largest weight/market value first
        usort($evaluated, fn ($a, $b) => $b['market_value'] <=> $a['market_value']);

        $sectorAllocation = [];
        foreach ($sectorTotals as $sectorName => $secVal) {
            $sectorAllocation[] = [
                'sector' => ucwords(strtolower($sectorName)),
                'value' => round($secVal, 2),
                'weight_pct' => $totalAum > 0 ? round(($secVal / $totalAum) * 100, 2) : 0,
            ];
        }
        usort($sectorAllocation, fn ($a, $b) => $b['weight_pct'] <=> $a['weight_pct']);

        $totalUnits = array_sum(array_column($evaluated, 'shares'));

        // Build Shariah-compliant replacement suggestions for flagged non-compliant/doubtful holdings
        $flaggedHoldings = array_values(array_filter(
            $evaluated,
            fn ($item) => in_array($item['status'], ['non-compliant', 'doubtful'], true)
        ));
        $rebalancingSuggestions = [];

        if (! empty($flaggedHoldings)) {
            $halalPool = Company::select(['symbol', 'name', 'sector', 'latest_price', 'market_cap'])
                ->where(function ($q) {
                    $q->where('asset_class', 'equity')->orWhereNull('asset_class');
                })
                ->where(function ($q) {
                    $q->whereIn('current_status', ['halal', 'compliant'])
                        ->orWhereHas('aaoifiScreening', fn ($sq) => $sq->whereIn('final_status', ['halal', 'compliant']));
                })
                ->where('latest_price', '>', 0)
                ->orderByDesc('market_cap')
                ->limit(80)
                ->get();

            $existingSymbols = array_flip(array_column($evaluated, 'symbol'));

            foreach ($flaggedHoldings as $flagged) {
                $sectorKey = strtolower(trim((string) ($flagged['sector'] ?? '')));
                $sameSector = $halalPool->filter(function ($c) use ($sectorKey, $existingSymbols) {
                    $cSec = strtolower(trim((string) $c->sector));
                    return $cSec === $sectorKey && ! isset($existingSymbols[$c->symbol]);
                })->take(3);

                if ($sameSector->isEmpty()) {
                    $sameSector = $halalPool->filter(fn ($c) => ! isset($existingSymbols[$c->symbol]))->take(3);
                }

                $rebalancingSuggestions[] = [
                    'source_symbol' => $flagged['symbol'],
                    'source_name' => $flagged['name'],
                    'source_sector' => $flagged['sector'],
                    'source_status' => $flagged['status'],
                    'source_market_value' => $flagged['market_value'],
                    'source_weight_pct' => $flagged['weight_pct'],
                    'replacements' => $sameSector->map(function ($c) use ($flagged) {
                        $px = (float) $c->latest_price;
                        $estUnits = $px > 0 ? (int) round($flagged['market_value'] / $px) : 0;
                        return [
                            'symbol' => $c->symbol,
                            'name' => $c->name,
                            'sector' => $c->sector,
                            'latest_price' => round($px, 2),
                            'estimated_units' => $estUnits,
                        ];
                    })->values()->toArray(),
                ];
            }
        }

        $nearThresholdCount = count(array_filter($evaluated, fn ($h) => ! empty($h['is_near_threshold'])));
        $debtWeightDenom = 0.0;
        $debtWeightedSum = 0.0;
        $cashWeightDenom = 0.0;
        $cashWeightedSum = 0.0;
        $impureWeightDenom = 0.0;
        $impureWeightedSum = 0.0;

        foreach ($evaluated as $h) {
            $w = (float) ($h['market_value'] ?? 0);
            if ($w <= 0) {
                continue;
            }
            if ($h['debt_ratio'] !== null) {
                $debtWeightDenom += $w;
                $debtWeightedSum += $w * (float) $h['debt_ratio'];
            }
            if ($h['cash_ratio'] !== null) {
                $cashWeightDenom += $w;
                $cashWeightedSum += $w * (float) $h['cash_ratio'];
            }
            $impureWeightDenom += $w;
            $impureWeightedSum += $w * (float) ($h['impure_ratio'] ?? 0);
        }

        return [
            'holdings' => $evaluated,
            'sector_allocation' => $sectorAllocation,
            'rebalancing_suggestions' => $rebalancingSuggestions,
            'summary' => [
                'holdings_count' => count($evaluated),
                'compliant_count' => $compliantCount,
                'non_compliant_count' => $nonCompliantCount,
                'doubtful_count' => $doubtfulCount,
                'purify_required_count' => $purifyRequiredCount,
                'near_threshold_count' => $nearThresholdCount,
                'weighted_debt_ratio' => $debtWeightDenom > 0 ? round($debtWeightedSum / $debtWeightDenom, 2) : null,
                'weighted_cash_ratio' => $cashWeightDenom > 0 ? round($cashWeightedSum / $cashWeightDenom, 2) : null,
                'weighted_impure_ratio' => $impureWeightDenom > 0 ? round($impureWeightedSum / $impureWeightDenom, 2) : 0,
                'total_aum' => round($totalAum, 2),
                'compliant_aum' => round($compliantAum, 2),
                'compliant_pct' => $totalAum > 0 ? round(($compliantAum / $totalAum) * 100, 2) : 0,
                'non_compliant_aum' => round($nonCompliantAum, 2),
                'non_compliant_pct' => $totalAum > 0 ? round(($nonCompliantAum / $totalAum) * 100, 2) : 0,
                'doubtful_aum' => round($doubtfulAum, 2),
                'doubtful_pct' => $totalAum > 0 ? round(($doubtfulAum / $totalAum) * 100, 2) : 0,
                'unmapped_aum' => round($unmappedAum, 2),
                'total_purification_due' => round($totalPurification, 2),
                'weighted_purification_per_unit' => $totalUnits > 0 ? round($totalPurification / $totalUnits, 4) : 0,
                'screened_at' => now()->toISOString(),
            ],
        ];
    }

    /**
     * Lightweight deterministic CSV parser for institutional portfolio templates.
     * Supports columns like Symbol/Ticker, Shares/Units/Quantity, Price/AvgCost, Name.
     */
    protected function parseInstitutionalCsv(string $filePath): array
    {
        $handle = fopen($filePath, 'r');
        if (! $handle) {
            return [];
        }

        $header = null;
        $rows = [];
        while (($data = fgetcsv($handle)) !== false) {
            if (empty(array_filter($data, fn ($v) => trim((string) $v) !== ''))) {
                continue;
            }
            if ($header === null) {
                $header = array_map(fn ($h) => strtolower(trim((string) preg_replace('/^\xEF\xBB\xBF/', '', $h))), $data);
                continue;
            }

            $assoc = [];
            foreach ($header as $idx => $col) {
                $assoc[$col] = isset($data[$idx]) ? trim((string) $data[$idx]) : '';
            }

            $sym = $assoc['symbol'] ?? $assoc['ticker'] ?? $assoc['stock'] ?? $assoc['security'] ?? $assoc['asset'] ?? null;
            $sharesRaw = $assoc['shares'] ?? $assoc['units'] ?? $assoc['quantity'] ?? $assoc['qty'] ?? $assoc['volume'] ?? null;
            $priceRaw = $assoc['price'] ?? $assoc['avg_price'] ?? $assoc['cost'] ?? $assoc['unit_price'] ?? null;
            $label = $assoc['name'] ?? $assoc['company'] ?? $assoc['security_name'] ?? null;

            if ($sym) {
                $shares = (float) preg_replace('/[^0-9.]/', '', (string) ($sharesRaw ?? '0'));
                $price = $priceRaw !== null ? (float) preg_replace('/[^0-9.]/', '', (string) $priceRaw) : null;
                $rows[] = [
                    'symbol' => $sym,
                    'shares' => $shares > 0 ? $shares : 1000,
                    'avg_price' => ($price && $price > 0) ? $price : null,
                    'label' => $label ?: null,
                ];
            }
        }
        fclose($handle);

        return $rows;
    }
}
