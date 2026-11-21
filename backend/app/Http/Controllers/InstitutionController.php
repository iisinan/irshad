<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\InstitutionalPortfolio;
use App\Services\StatementParserService;
use App\Traits\ApiResponder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
            'units_in_issue' => 33400000,
            'expense_ratio_pct' => 0.95,
            'bid_offer_spread_pct' => 1.4,
            'replication' => 'Full physical',
            'holding_period' => 'Five years or more',
            'volatility_3y_pct' => 24.5,
            'top_5_concentration_pct' => 66.5,
            'tracking_error_3y_pct' => 4.8,
            'risk_rating' => 6,
            'risk_max' => 7,
            'zakat_per_unit' => 21.40,
            'screening_result' => $lotusScreened,
            'rebalance_removed' => $removedNascon['holdings'][0] ?? null,
        ];
    }

    protected function buildBalancedPreset(): array
    {
        $equitySleeve = $this->evaluateHoldingsArray([
            ['symbol' => 'ARADEL',    'label' => 'Aradel Holdings PLC',              'sector' => 'Oil & Gas',          'shares' => 183200],
            ['symbol' => 'MTNN',      'label' => 'MTN Nigeria Communications PLC',   'sector' => 'Telecommunications', 'shares' => 218800],
            ['symbol' => 'DANGCEM',   'label' => 'Dangote Cement PLC',               'sector' => 'Industrial Goods',   'shares' => 152000],
            ['symbol' => 'BUACEMENT', 'label' => 'BUA Cement PLC',                   'sector' => 'Industrial Goods',   'shares' => 478000],
            ['symbol' => 'HBMNG',     'label' => 'Lafarge Africa PLC (HBMNG)',       'sector' => 'Industrial Goods',   'shares' => 164000],
            ['symbol' => 'BUAFOODS',  'label' => 'BUA Foods PLC',                    'sector' => 'Consumer Goods',     'shares' => 164800],
            ['symbol' => 'JAIZBANK',  'label' => 'Jaiz Bank PLC',                    'sector' => 'Banking',            'shares' => 2240000],
        ]);

        return [
            'id' => 'balanced_fund',
            'institution_name' => 'Irshad Shariah Fund Benchmark',
            'fund_name' => 'Halal Balanced Fund (60/40 Model)',
            'factsheet_date' => 'October 2026',
            'unit_price' => 108.27,
            'ytd_yield' => 17.72,
            'fund_size_label' => '₦6.81bn',
            'fund_size_ngn' => 6810000000,
            'units_in_issue' => 62900000,
            'total_expense_ratio' => '1.60%',
            'management_fee' => '1.25%',
            'launch_date' => 'January 2025',
            'status' => 'Open Ended',
            'bias' => '60% Islamic Fixed Income / 40% Halal Equities',
            'initial_investment' => '50 Units',
            'distributions' => 'Quarterly',
            'redemption' => 'Daily, 3 business days',
            'risk_rating' => 4,
            'risk_max' => 7,
            'risk_label' => 'Moderate',
            'volatility_3y_pct' => 11.8,
            'purification_per_unit_fy25' => 0.18,
            'zakat_per_unit' => 16.80,
            'allocation' => [
                ['security' => 'Halal NGX Equities',      'current' => 40.00, 'target_min' => 30, 'target_max' => 50, 'target_label' => '30% - 50%', 'shariah_contract' => 'Screened Common Equity', 'status' => 'Within Mandate'],
                ['security' => 'FGN Sukuk',               'current' => 36.00, 'target_min' => 25, 'target_max' => 60, 'target_label' => '25% - 60%', 'shariah_contract' => 'Sukuk Al-Ijarah',        'status' => 'Within Mandate'],
                ['security' => 'Corporate Sukuk',         'current' => 11.00, 'target_min' => 0,  'target_max' => 30, 'target_label' => '0% - 30%',  'shariah_contract' => 'Sukuk Al-Wakalah',       'status' => 'Within Mandate'],
                ['security' => 'Mudarabah Placements',    'current' => 7.00,  'target_min' => 0,  'target_max' => 25, 'target_label' => '0% - 25%',  'shariah_contract' => 'Profit-Sharing',         'status' => 'Within Mandate'],
                ['security' => 'Murabaha Contracts',      'current' => 4.00,  'target_min' => 0,  'target_max' => 20, 'target_label' => '0% - 20%',  'shariah_contract' => 'Cost-Plus Trade',        'status' => 'Within Mandate'],
                ['security' => 'Ijarah Sukuk',            'current' => 1.00,  'target_min' => 0,  'target_max' => 15, 'target_label' => '0% - 15%',  'shariah_contract' => 'Leasing Sukuk',          'status' => 'Within Mandate'],
                ['security' => 'Non-Interest Cash',       'current' => 1.00,  'target_min' => 0,  'target_max' => 10, 'target_label' => '0% - 10%',  'shariah_contract' => 'Wadiah / Current',       'status' => 'Within Mandate'],
            ],
            'maturity_profile' => [
                ['bucket' => '<1 yr', 'pct' => 19],
                ['bucket' => '1 to 3 yr', 'pct' => 14],
                ['bucket' => '>3 yr', 'pct' => 27],
                ['bucket' => 'Equity', 'pct' => 40],
            ],
            'screening_result' => $equitySleeve,
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
     * Institution accounts start with zero pre-loaded data until they upload and save their own portfolios.
     * Admin accounts still receive the demo presets for review/demonstration.
     */
    public function workspace(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user->role === 'admin';
        $tenantKey = $isAdmin ? 'admin' : 'custom';

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
            'balanced_fund' => null,
        ];

        if ($isAdmin) {
            $payload['lotus_etf'] = $this->buildLotusPreset();
            $payload['norrenberger_fund'] = $this->buildNorrenbergerPreset();
            $payload['balanced_fund'] = $this->buildBalancedPreset();
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
            'balanced_fund' => $this->buildBalancedPreset(),
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

        $top5Concentration = round(array_sum(array_map(fn ($h) => (float) ($h['weight_pct'] ?? 0), array_slice($evaluated, 0, 5))), 2);
        $top10Concentration = round(array_sum(array_map(fn ($h) => (float) ($h['weight_pct'] ?? 0), array_slice($evaluated, 0, 10))), 2);
        $totalZakatable = round($compliantAum * 0.025, 2);

        $aliasesApplied = array_values(array_unique(array_filter(array_map(
            fn ($h) => ($h['input_symbol'] ?? '') !== '' && ($h['input_symbol'] ?? '') !== ($h['symbol'] ?? '')
                ? "{$h['input_symbol']} → {$h['symbol']}"
                : null,
            $evaluated
        ))));

        $summary = [
            'holdings_count' => count($evaluated),
            'compliant_count' => $compliantCount,
            'non_compliant_count' => $nonCompliantCount,
            'doubtful_count' => $doubtfulCount,
            'purify_required_count' => $purifyRequiredCount,
            'near_threshold_count' => $nearThresholdCount,
            'top_5_concentration_pct' => $top5Concentration,
            'top_10_concentration_pct' => $top10Concentration,
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
            'total_zakatable_amount' => $totalZakatable,
            'indicative_zakat_per_unit' => $totalUnits > 0 ? round($totalZakatable / $totalUnits, 4) : 0,
            'aliases_applied' => $aliasesApplied,
            'screened_at' => now()->toISOString(),
        ];

        $smartBrief = $this->buildSmartBrief($evaluated, $sectorAllocation, $rebalancingSuggestions, $summary);

        return [
            'holdings' => $evaluated,
            'sector_allocation' => $sectorAllocation,
            'rebalancing_suggestions' => $rebalancingSuggestions,
            'summary' => $summary,
            'smart_brief' => $smartBrief,
        ];
    }

    /**
     * Synthesize actionable compliance intelligence, auto-rebalance swaps, risk classification,
     * concentration alerts, and ready-to-publish manager commentary from evaluated holdings.
     */
    protected function buildSmartBrief(
        array $evaluated,
        array $sectorAllocation,
        array $rebalancingSuggestions,
        array $summary
    ): array {
        $nonCompliant = (int) ($summary['non_compliant_count'] ?? 0);
        $doubtful = (int) ($summary['doubtful_count'] ?? 0);
        $nearCount = (int) ($summary['near_threshold_count'] ?? 0);
        $compliantPct = (float) ($summary['compliant_pct'] ?? 0);
        $top5Pct = (float) ($summary['top_5_concentration_pct'] ?? 0);
        $holdingsCount = (int) ($summary['holdings_count'] ?? 0);

        $readiness = ($nonCompliant > 0 || $doubtful > 0)
            ? 'REMEDIATION_REQUIRED'
            : ($nearCount > 0 ? 'COMPLIANT_DRIFT_WATCH' : 'CERTIFIED_READY');

        // Concentration warnings
        $warnings = [];
        foreach ($evaluated as $h) {
            if ((float) ($h['weight_pct'] ?? 0) >= 20.0) {
                $warnings[] = [
                    'type' => 'single_name',
                    'message' => "{$h['symbol']} carries {$h['weight_pct']}% single-name weight (>= 20% prudence threshold).",
                ];
            }
        }
        foreach ($sectorAllocation as $sec) {
            if ((float) ($sec['weight_pct'] ?? 0) >= 40.0) {
                $warnings[] = [
                    'type' => 'sector',
                    'message' => "{$sec['sector']} represents {$sec['weight_pct']}% of AUM (>= 40% sector ceiling).",
                ];
            }
        }

        // Dynamic SEC 1–7 risk classification based on diversification & concentration
        if ($holdingsCount <= 4 || $top5Pct >= 80) {
            $riskLevel = 6;
            $riskLabel = 'High Growth / Concentrated, 6 of 7';
        } elseif ($top5Pct >= 60 || $holdingsCount <= 8) {
            $riskLevel = 5;
            $riskLabel = 'Moderate High Equity, 5 of 7';
        } else {
            $riskLevel = 4;
            $riskLabel = 'Balanced Diversified Equity, 4 of 7';
        }

        // Build 1-click Auto-Align-to-Halal rebalance plan
        $swapMap = [];
        $swaps = [];
        foreach ($rebalancingSuggestions as $sug) {
            $best = $sug['replacements'][0] ?? null;
            if (! $best || (int) ($best['estimated_units'] ?? 0) <= 0) {
                continue;
            }
            $swapMap[$sug['source_symbol']] = $best;
            $swaps[] = [
                'from_symbol' => $sug['source_symbol'],
                'to_symbol' => $best['symbol'],
                'to_name' => $best['name'],
                'estimated_units' => (int) $best['estimated_units'],
                'latest_price' => (float) $best['latest_price'],
                'released_aum' => (float) ($sug['source_market_value'] ?? 0),
            ];
        }

        $proposedHoldingsMap = [];
        foreach ($evaluated as $h) {
            $sym = $h['symbol'];
            if (isset($swapMap[$sym])) {
                $rep = $swapMap[$sym];
                $repSym = $rep['symbol'];
                if (! isset($proposedHoldingsMap[$repSym])) {
                    $proposedHoldingsMap[$repSym] = [
                        'symbol' => $repSym,
                        'shares' => 0,
                        'avg_price' => (float) $rep['latest_price'],
                    ];
                }
                $proposedHoldingsMap[$repSym]['shares'] += (int) $rep['estimated_units'];
            } elseif (($h['status'] ?? '') === 'halal') {
                if (! isset($proposedHoldingsMap[$sym])) {
                    $proposedHoldingsMap[$sym] = [
                        'symbol' => $sym,
                        'shares' => 0,
                        'avg_price' => (float) $h['current_price'],
                    ];
                }
                $proposedHoldingsMap[$sym]['shares'] += (float) $h['shares'];
            }
        }

        // Auto-drafted publication commentary
        $topTickers = implode(', ', array_map(fn ($h) => "{$h['symbol']} ({$h['weight_pct']}%)", array_slice($evaluated, 0, 3)));
        $leadSector = $sectorAllocation[0]['sector'] ?? 'Equities';
        $leadSectorPct = $sectorAllocation[0]['weight_pct'] ?? 0;
        $purifFormatted = '₦' . number_format((float) ($summary['total_purification_due'] ?? 0), 2);
        $commentary = "Across {$holdingsCount} evaluated holdings led by {$leadSector} ({$leadSectorPct}%) and core positions {$topTickers}, {$compliantPct}% of portfolio AUM satisfies AAOIFI Standard No. 21 screening.";
        if ($nonCompliant > 0) {
            $commentary .= " {$nonCompliant} non-compliant holding(s) have been flagged for divestment into verified Halal sector peers.";
        } else {
            $commentary .= " Aggregate purification liability stands at {$purifFormatted}.";
        }
        if ($nearCount > 0) {
            $commentary .= " {$nearCount} constituent(s) are placed on Drift Watch near AAOIFI ratio thresholds.";
        }

        return [
            'readiness' => $readiness,
            'risk_classification' => [
                'level' => $riskLevel,
                'max' => 7,
                'label' => $riskLabel,
            ],
            'concentration_warnings' => $warnings,
            'suggested_commentary' => $commentary,
            'auto_rebalance_plan' => [
                'available' => ! empty($swaps) && ! empty($proposedHoldingsMap),
                'swaps_count' => count($swaps),
                'swaps' => $swaps,
                'projected_compliant_pct' => ! empty($proposedHoldingsMap) ? 100.0 : $compliantPct,
                'proposed_holdings' => array_values($proposedHoldingsMap),
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

    /**
     * Smart Auto-Fill engine for Factsheet & One-Page Summary setup.
     * Derives quantitative KPIs, reconciles fee lines & units, classifies SEC risk 1-7,
     * extracts Drift/Non-Compliance audit logs, and synthesizes executive commentary (with Gemini enhancement when available).
     */
    public function smartAutofill(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fund_name' => 'nullable|string|max:180',
            'institution_name' => 'nullable|string|max:180',
            'mandate_type' => 'nullable|string|max:80',
            'preset_id' => 'nullable|string|max:64',
            'ticker' => 'nullable|string|max:40',
            'nav_per_unit' => 'nullable|numeric|min:0',
            'expense_ratio_pct' => 'nullable|numeric|min:0|max:20',
            'fee_lines' => 'nullable|array',
            'holdings' => 'nullable|array|max:250',
            'holdings.*.symbol' => 'required_with:holdings|string|max:64',
            'holdings.*.shares' => 'required_with:holdings|numeric|min:0',
        ]);

        $user = $request->user();
        $institutionName = trim((string) ($validated['institution_name'] ?? $user->institution_name ?? $user->name ?? 'Irshad Institutional'));
        $fundName = trim((string) ($validated['fund_name'] ?? 'Institutional Shariah Mandate'));
        $presetId = (string) ($validated['preset_id'] ?? '');
        $mandateType = (string) ($validated['mandate_type'] ?? '');

        $isFixed = $presetId === 'norrenberger_fund' || stripos($mandateType, 'fixed income') !== false;
        $isBalanced = $presetId === 'balanced_fund' || stripos($mandateType, 'balanced') !== false;

        $holdingsInput = $validated['holdings'] ?? [];
        $evaluated = ! empty($holdingsInput) ? $this->evaluateHoldingsArray($holdingsInput) : null;
        $summary = $evaluated['summary'] ?? [];
        $smartBrief = $evaluated['smart_brief'] ?? [];
        $evaluatedHoldings = $evaluated['holdings'] ?? [];

        // 1. Fund Size & Units Derivation
        $fundSize = (float) ($summary['total_aum'] ?? 0);
        if ($fundSize <= 0 && ($isFixed || $isBalanced)) {
            $fundSize = 6810000000.0;
        }
        $nav = (float) ($validated['nav_per_unit'] ?? 0);
        if ($nav <= 0 && ($isFixed || $isBalanced)) {
            $nav = 108.27;
        }
        $derivedUnits = ($fundSize > 0 && $nav > 0) ? (int) round($fundSize / $nav) : null;

        // 2. Smart Ticker Generation if placeholder or blank
        $rawTicker = strtoupper(trim((string) ($validated['ticker'] ?? '')));
        $ticker = ($rawTicker === '' || $rawTicker === 'IRSHAD-MANDATE')
            ? $this->generateSmartTicker($fundName, $institutionName)
            : $rawTicker;

        // 3. SEC Risk Rating & 3Y Volatility Estimate
        if ($isFixed) {
            $riskLevel = 2;
            $riskLabel = 'Conservative, 2 of 7';
            $volatility = 3.4;
            $holdingPeriod = 'Minimum 90-180 days';
            $benchmark = '3-year FGN Sukuk (Moving Average)';
        } elseif ($isBalanced) {
            $riskLevel = 4;
            $riskLabel = 'Moderate, 4 of 7';
            $volatility = 11.8;
            $holdingPeriod = 'Three years or more';
            $benchmark = 'Blended (40% NGXLII / 60% FGN Sukuk)';
        } else {
            $riskLevel = (int) ($smartBrief['risk_classification']['level'] ?? 4);
            $riskLabel = (string) ($smartBrief['risk_classification']['label'] ?? "Balanced Growth, {$riskLevel} of 7");
            $top5 = (float) ($summary['top_5_concentration_pct'] ?? 60.0);
            $volatility = round(min(32.0, max(12.5, 11.0 + ($top5 * 0.18))), 1);
            $holdingPeriod = $riskLevel >= 5 ? 'Five years or more' : 'Three years or more';
            $benchmark = 'NGX Lotus Islamic Index (NGXLII)';
        }

        // 4. Fee Line Reconciliation to TER
        $feeLines = $validated['fee_lines'] ?? [];
        if (empty($feeLines)) {
            $feeLines = $isFixed
                ? [['label' => 'Management Fee', 'pct' => 1.50], ['label' => 'Custody, Trustee & Audit', 'pct' => 0.40]]
                : [['label' => 'Management Fee', 'pct' => 0.55], ['label' => 'Custody & Shariah Advisory', 'pct' => 0.20]];
        }
        $sumFees = round(array_sum(array_map(fn ($f) => (float) ($f['pct'] ?? 0), $feeLines)), 2);
        $expenseRatio = $sumFees > 0 ? $sumFees : (float) ($validated['expense_ratio_pct'] ?? 0.75);
        $managementFeeStr = number_format((float) ($feeLines[0]['pct'] ?? $expenseRatio), 2) . '%';

        // 5. Purification & Zakat Defaults from Live Screening
        $purifPerUnit = isset($summary['weighted_purification_per_unit'])
            ? (float) $summary['weighted_purification_per_unit']
            : ($isFixed ? 0.00 : ($isBalanced ? 0.18 : 0.00));
        $zakatPerUnit = isset($summary['indicative_zakat_per_unit']) && (float) $summary['indicative_zakat_per_unit'] > 0
            ? (float) $summary['indicative_zakat_per_unit']
            : ($nav > 0 ? round($nav * 0.025, 2) : 0.00);

        // 6. Auto-Detect Audit / Drift Log Events from Flagged or Watched Constituents
        $autoEvents = [];
        foreach ($evaluatedHoldings as $h) {
            if (($h['status'] ?? '') !== 'halal') {
                $autoEvents[] = [
                    'date' => now()->toDateString(),
                    'symbol' => $h['symbol'],
                    'action' => 'Flagged Non-Compliant',
                    'detail' => "Failed AAOIFI screen ({$h['impure_ratio']}% impure revenue). Remediation swap recommended.",
                ];
            } elseif (! empty($h['is_near_threshold'])) {
                $autoEvents[] = [
                    'date' => now()->toDateString(),
                    'symbol' => $h['symbol'],
                    'action' => 'Drift Watch',
                    'detail' => "Approaching AAOIFI ratio cap (Debt: {$h['debt_ratio']}%, Cash: {$h['cash_ratio']}%, Impure: {$h['impure_ratio']}%).",
                ];
            }
        }

        // 7. Narrative Drafting (Deterministic + Optional Gemini AI Enrichment)
        $objective = $isFixed
            ? "Preserve institutional liquidity and generate non-interest returns through certified FGN/Corporate Sukuk, Mudarabah, and Murabaha placements overseen under SEC & AAOIFI standards."
            : ($isBalanced
                ? "Deliver balanced capital appreciation and quarterly income by pairing 40% AAOIFI-screened NGX halal equities with 60% certified Sukuk and non-interest money market instruments."
                : "Achieve competitive long-term capital growth strictly within AAOIFI Standard No. 21 boundaries (<30% debt, <30% interest-bearing cash, <5% non-permissible income) with automated dividend purification.");

        $commentary = $smartBrief['suggested_commentary']
            ?? "Portfolio allocations remain monitored against {$benchmark} with continuous AAOIFI compliance oversight and quarterly distribution governance.";

        $investorProfile = $riskLevel >= 5
            ? "Suitable for Pension Fund Administrators (PFAs), Islamic asset managers, endowments, and growth-focused institutional mandates with a {$holdingPeriod} horizon."
            : "Built for institutional treasuries, Takaful operators, corporate cash desks, and capital-preservation mandates seeking SEC-regulated Shariah returns.";

        $aiEnhanced = false;
        if (! empty($evaluatedHoldings) && ! empty(config('services.gemini.key'))) {
            $aiCopy = $this->draftCopyWithGemini($fundName, $institutionName, $summary, $evaluatedHoldings);
            if (! empty($aiCopy)) {
                $objective = $aiCopy['objective'] ?? $objective;
                $commentary = $aiCopy['commentary'] ?? $commentary;
                $investorProfile = $aiCopy['investor_profile'] ?? $investorProfile;
                $aiEnhanced = true;
            }
        }

        $filledFields = [
            'Ticker & Cut-Off Date',
            'Benchmark Index',
            'SEC Risk Rating & 3Y Volatility',
            'TER Fee Reconciliation',
            'Mandate Objective & Suitability',
            'Manager & Shariah Commentary',
        ];
        if (! empty($evaluatedHoldings)) {
            $filledFields[] = 'Fund Size, Purification & Zakat';
        }
        if (! empty($autoEvents)) {
            $filledFields[] = count($autoEvents) . ' Audit Event(s)';
        }

        return $this->success([
            'autofill' => [
                'ticker' => $ticker,
                'factsheet_date' => now()->format('jS F, Y'),
                'fund_size_ngn' => $fundSize > 0 ? round($fundSize, 2) : null,
                'nav_per_unit' => $nav > 0 ? $nav : null,
                'units_in_issue' => $derivedUnits,
                'benchmark' => $benchmark,
                'risk_level' => $riskLevel,
                'risk_label' => $riskLabel,
                'volatility_3y_pct' => $volatility,
                'holding_period' => $holdingPeriod,
                'rebalancing_frequency' => $isFixed ? 'Monthly' : 'Quarterly / Continuous Watch',
                'fee_lines' => $feeLines,
                'expense_ratio_pct' => $expenseRatio,
                'management_fee' => $managementFeeStr,
                'purification_per_unit_input' => round($purifPerUnit, 4),
                'zakat_per_unit_input' => round($zakatPerUnit, 2),
                'shariah_board' => 'Irshad Tech Ltd (AAOIFI Standard No. 21 Certified Screening)',
                'objective' => $objective,
                'commentary' => $commentary,
                'investor_profile' => $investorProfile,
                'suggested_events' => array_slice($autoEvents, 0, 10),
            ],
            'filled_fields' => $filledFields,
            'ai_enhanced' => $aiEnhanced,
        ], 'Smart Auto-Fill completed.');
    }

    protected function generateSmartTicker(string $fundName, string $institutionName): string
    {
        $words = preg_split('/[^A-Za-z0-9]+/', trim($fundName . ' ' . $institutionName), -1, PREG_SPLIT_NO_EMPTY);
        $skip = ['LIMITED', 'LTD', 'PLC', 'THE', 'AND', 'OF', 'FUND', 'MANDATE', 'INSTITUTIONAL'];
        $letters = '';
        foreach ($words as $w) {
            $u = strtoupper($w);
            if (in_array($u, $skip, true)) {
                continue;
            }
            $letters .= substr($u, 0, 2);
            if (strlen($letters) >= 8) {
                break;
            }
        }
        return substr($letters ?: 'IRSHFUND', 0, 10);
    }

    protected function draftCopyWithGemini(string $fundName, string $institutionName, array $summary, array $holdings): ?array
    {
        try {
            $apiKeys = array_map('trim', explode(',', (string) config('services.gemini.key')));
            $idx = Cache::get('gemini_key_index', 0);
            $apiKey = $apiKeys[$idx] ?? ($apiKeys[0] ?? '');
            if ($apiKey === '') {
                return null;
            }

            $top5 = array_map(fn ($h) => "{$h['symbol']} ({$h['weight_pct']}%, {$h['status']})", array_slice($holdings, 0, 5));
            $prompt = "You are writing institutional factsheet copy for {$institutionName}'s '{$fundName}' in Nigeria (NGX equities). Use ONLY these verified metrics: Holdings=" . ($summary['holdings_count'] ?? count($holdings))
                . ', Compliant%=' . ($summary['compliant_pct'] ?? 100)
                . ', Top5Concentration%=' . ($summary['top_5_concentration_pct'] ?? 0)
                . ', TotalPurificationNGN=' . ($summary['total_purification_due'] ?? 0)
                . ', TopHoldings=[' . implode('; ', $top5) . ']. '
                . 'Return strict JSON with keys "objective" (max 35 words), "commentary" (max 45 words referencing exact numbers), and "investor_profile" (max 30 words).';

            $response = Http::timeout(8)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={$apiKey}",
                [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => ['temperature' => 0.2, 'responseMimeType' => 'application/json'],
                ]
            );

            if ($response->successful()) {
                $raw = trim(str_replace(['```json', '```'], '', (string) $response->json('candidates.0.content.parts.0.text')));
                $decoded = json_decode($raw, true);
                if (is_array($decoded) && ! empty($decoded['commentary'])) {
                    return $decoded;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('[InstitutionController::draftCopyWithGemini] Fallback to deterministic copy: ' . $e->getMessage());
        }
        return null;
    }
}
