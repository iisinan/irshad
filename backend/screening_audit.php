<?php

/**
 * AAOIFI Screening Audit Script
 * Checks all stocks and verifies if their verdicts are correct.
 *
 * AAOIFI Rules:
 * Rule 1 - Business Activity: No prohibited sectors (banks, insurance, alcohol, tobacco, gambling etc.)
 * Rule 2 - Debt Ratio: Total Debt / Market Cap <= 30%
 * Rule 3 - Cash & Securities: (Cash + Interest-bearing Securities) / Market Cap <= 30%
 * Rule 4 - Impermissible Income: Interest Income / Total Revenue <= 5%
 *
 * Verdict logic from AaoifiComplianceService.php:
 * - business_fail OR debt_fail OR cash_fail => non-halal
 * - business_warning OR debt_insufficient OR cash_insufficient => doubtful
 * - all pass => halal
 */

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// ─── AAOIFI Constants (from AaoifiComplianceService) ───────
const MAX_DEBT_RATIO = 30.0;       // %
const MAX_CASH_RATIO = 30.0;       // %
const MAX_INTEREST_INCOME_RATIO = 5.0; // %
const MIN_ILLIQUID_RATIO = 30.0;   // %
const MAX_RECEIVABLES_RATIO = 45.0; // %

const BLACKLIST_KEYWORDS = [
    "bank", "financial services", "financial", "insurance",
    "capital market", "mortgage", "microfinance", "micro-finance",
    "tobacco", "distillery", "distiller", "winery", "vintner",
    "brewery", "breweries", "brewer", "guinness",
    "gambling", "casino", "conventional lending",
    "alcohol production", "alcohol distribution", "liquor", "spirits"
];

// ─── Fetch all companies with latest financials & status ──────
$stocks = DB::table('companies as c')
    ->leftJoin('financials as f', function($j) {
        $j->on('f.company_id', '=', 'c.id')
          ->whereRaw('f.id = (SELECT id FROM financials WHERE company_id = c.id ORDER BY created_at DESC LIMIT 1)');
    })
    ->leftJoin('stock_statuses as ss', 'ss.company_id', '=', 'c.id')
    ->leftJoin('aaoifi_screenings as a', function($j) {
        $j->on('a.company_id', '=', 'c.id')
          ->whereRaw('a.id = (SELECT id FROM aaoifi_screenings WHERE company_id = c.id ORDER BY created_at DESC LIMIT 1)');
    })
    ->select(
        'c.id', 'c.symbol', 'c.name', 'c.sector', 'c.business_type',
        'ss.status as current_verdict', 'ss.verified_by_scholar',
        'ss.reason as verdict_reason',
        'f.market_cap', 'f.total_assets', 'f.total_debt',
        'f.cash_and_equivalents', 'f.interest_bearing_securities',
        'f.accounts_receivable', 'f.illiquid_assets',
        'f.interest_income', 'f.total_revenue',
        'a.business_status', 'a.debt_ratio as stored_debt_ratio',
        'a.cash_ratio as stored_cash_ratio',
        'a.impermissible_income_ratio as stored_interest_ratio',
        'a.final_status as screening_verdict',
        'a.created_at as screened_at'
    )
    ->orderBy('c.symbol')
    ->get();

// ─── Results containers ─────────────────────────────────────
$correct = [];
$wrong = [];
$noData = [];
$businessFails = [];

foreach ($stocks as $s) {
    $symbol = $s->symbol;
    $currentVerdict = $s->current_verdict ?? 'unknown';

    // ── Rule 1: Business Activity ──────────────────────────
    $sector = strtolower($s->sector ?? '');
    $businessType = strtolower($s->business_type ?? '');
    $name = strtolower($s->name ?? '');
    $symLower = strtolower($symbol ?? '');

    $isJaiz = in_array(strtoupper($symbol), ['JAIZBANK', 'JAIZ']);
    $businessFail = false;
    $matchedKeyword = null;

    if (!$isJaiz) {
        foreach (BLACKLIST_KEYWORDS as $kw) {
            if (str_contains($sector, $kw) || str_contains($businessType, $kw) ||
                str_contains($name, $kw) || str_contains($symLower, $kw)) {
                $businessFail = true;
                $matchedKeyword = $kw;
                break;
            }
        }
    }

    // ── Financial Data availability check ─────────────────
    $marketCap = (float)($s->market_cap ?? 0);
    $totalDebt = (float)($s->total_debt ?? 0);
    $cash = (float)($s->cash_and_equivalents ?? 0);
    $interestBearingSecurities = (float)($s->interest_bearing_securities ?? 0);
    $totalRevenue = (float)($s->total_revenue ?? 0);
    $interestIncome = (float)($s->interest_income ?? 0);
    $totalAssets = (float)($s->total_assets ?? 0);
    $accountsReceivable = (float)($s->accounts_receivable ?? 0);
    $illiquidAssets = (float)($s->illiquid_assets ?? 0);

    $hasFinancials = $marketCap > 0 || $totalAssets > 0 || $totalRevenue > 0;

    // ── Rule 2: Debt Ratio ─────────────────────────────────
    $debtRatio = null;
    $debtStatus = 'insufficient_data';
    if ($marketCap > 0) {
        $debtRatio = ($totalDebt / $marketCap) * 100;
        $debtStatus = $debtRatio <= MAX_DEBT_RATIO ? 'pass' : 'fail';
    }

    // ── Rule 3: Cash & Securities ──────────────────────────
    $cashRatio = null;
    $cashStatus = 'insufficient_data';
    if ($marketCap > 0) {
        $cashRatio = (($cash + $interestBearingSecurities) / $marketCap) * 100;
        $cashStatus = $cashRatio <= MAX_CASH_RATIO ? 'pass' : 'fail';
    }

    // ── Rule 4: Impermissible Income ───────────────────────
    $interestRatio = null;
    $interestStatus = 'insufficient_data';
    if ($totalRevenue > 0) {
        $interestRatio = ($interestIncome / $totalRevenue) * 100;
        $interestStatus = $interestRatio <= MAX_INTEREST_INCOME_RATIO ? 'pass' : 'fail';
    }

    // ── Rule 5: Receivables Ratio ──────────────────────────
    $receivablesRatio = null;
    $receivablesStatus = 'insufficient_data';
    if ($totalAssets > 0 && $accountsReceivable > 0) {
        $receivablesRatio = ($accountsReceivable / $totalAssets) * 100;
        $receivablesStatus = $receivablesRatio <= MAX_RECEIVABLES_RATIO ? 'pass' : 'fail';
    }

    // ── Recalculate Expected Verdict ───────────────────────
    $expectedVerdict = 'halal';

    if ($businessFail || $debtStatus === 'fail' || $cashStatus === 'fail') {
        $expectedVerdict = 'non-halal';
    } elseif ($debtStatus === 'insufficient_data' || $cashStatus === 'insufficient_data') {
        $expectedVerdict = 'doubtful';
    }

    // ── Also flag interest income fails ───────────────────
    $interestFail = $interestStatus === 'fail';

    // Determine why it might be wrong
    $issues = [];
    if ($businessFail) $issues[] = "Business: FAIL (keyword: '$matchedKeyword' in sector/name/type)";
    if ($debtStatus === 'fail') $issues[] = "Debt: FAIL (" . round($debtRatio, 2) . "% > 30%)";
    if ($debtStatus === 'insufficient_data') $issues[] = "Debt: MISSING (no market cap)";
    if ($cashStatus === 'fail') $issues[] = "Cash: FAIL (" . round($cashRatio, 2) . "% > 30%)";
    if ($cashStatus === 'insufficient_data') $issues[] = "Cash: MISSING (no market cap)";
    if ($interestFail) $issues[] = "Interest Income: FAIL (" . round($interestRatio, 2) . "% > 5%)";
    if ($receivablesStatus === 'fail') $issues[] = "Receivables: FAIL (" . round($receivablesRatio, 2) . "% > 45%)";

    $entry = [
        'symbol' => $symbol,
        'name'   => $s->name,
        'sector' => $s->sector,
        'business_type' => $s->business_type,
        'current_verdict' => $currentVerdict,
        'expected_verdict' => $expectedVerdict,
        'verified_by_scholar' => $s->verified_by_scholar,
        'issues' => $issues,
        'ratios' => [
            'market_cap_b' => round($marketCap / 1e9, 2),
            'debt_ratio'   => $debtRatio ? round($debtRatio, 2) : null,
            'cash_ratio'   => $cashRatio ? round($cashRatio, 2) : null,
            'interest_income_ratio' => $interestRatio ? round($interestRatio, 2) : null,
            'receivables_ratio' => $receivablesRatio ? round($receivablesRatio, 2) : null,
        ],
        'verdict_reason' => $s->verdict_reason,
        'screened_at' => $s->screened_at,
    ];

    if (!$hasFinancials) {
        $noData[] = $entry;
    } elseif ($currentVerdict === $expectedVerdict) {
        $correct[] = $entry;
    } else {
        $wrong[] = $entry;
    }

    if ($businessFail) {
        $businessFails[] = array_merge($entry, ['keyword' => $matchedKeyword]);
    }
}

// ─── Output Report ─────────────────────────────────────────
$report = [
    'generated_at' => date('Y-m-d H:i:s'),
    'summary' => [
        'total'   => $stocks->count(),
        'correct' => count($correct),
        'wrong'   => count($wrong),
        'no_data' => count($noData),
        'business_fails_detected' => count($businessFails),
    ],
    'wrong_verdicts' => $wrong,
    'no_financial_data' => $noData,
    'correct_verdicts' => $correct,
    'business_activity_fails' => $businessFails,
];

file_put_contents(__DIR__ . '/screening_audit.json', json_encode($report, JSON_PRETTY_PRINT));
echo json_encode($report['summary'], JSON_PRETTY_PRINT) . "\n";
echo "\n--- WRONG VERDICTS (" . count($wrong) . ") ---\n";
foreach ($wrong as $w) {
    echo sprintf(
        "  %-12s | Current: %-10s | Should be: %-10s | Verified: %s\n",
        $w['symbol'],
        $w['current_verdict'],
        $w['expected_verdict'],
        $w['verified_by_scholar'] ? 'YES' : 'no'
    );
    foreach ($w['issues'] as $issue) {
        echo "             └─ $issue\n";
    }
}

echo "\n--- NO FINANCIAL DATA (" . count($noData) . ") ---\n";
foreach ($noData as $n) {
    echo "  " . $n['symbol'] . " — " . $n['name'] . "\n";
}
