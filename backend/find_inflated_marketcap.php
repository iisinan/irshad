<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$companies = \App\Models\Company::with(['aaoifiScreening'])->get();
$issues = [];

foreach ($companies as $company) {
    $aaoifi = $company->aaoifiScreening;
    if (!$aaoifi) continue;

    $financial = $company->financials()->latest()->first();
    if (!$financial) continue;

    $liveMarketCap = (float) ($company->market_cap ?? 0);
    $historicalMarketCap = (float) ($financial->market_cap ?? 0);

    if ($liveMarketCap <= 0 || $historicalMarketCap <= 0) continue;

    // How much bigger is historical vs live?
    $ratio = $historicalMarketCap / $liveMarketCap;

    $totalDebt = (float) $financial->total_debt;
    $cash = (float) $financial->cash_and_equivalents;
    $securities = (float) $financial->interest_bearing_securities;

    // Ratios using HISTORICAL (inflated) market cap
    $debtRatioHistorical = $historicalMarketCap > 0 ? ($totalDebt / $historicalMarketCap) * 100 : null;
    $cashRatioHistorical = $historicalMarketCap > 0 ? (($cash + $securities) / $historicalMarketCap) * 100 : null;

    // Ratios using LIVE (correct) market cap
    $debtRatioLive = $liveMarketCap > 0 ? ($totalDebt / $liveMarketCap) * 100 : null;
    $cashRatioLive = $liveMarketCap > 0 ? (($cash + $securities) / $liveMarketCap) * 100 : null;

    // Check if using the historical inflated cap made something PASS that should FAIL
    $debtPassedWrongly = $debtRatioHistorical !== null && $debtRatioLive !== null
        && $debtRatioHistorical <= 30 && $debtRatioLive > 30;

    $cashPassedWrongly = $cashRatioHistorical !== null && $cashRatioLive !== null
        && $cashRatioHistorical <= 30 && $cashRatioLive > 30;

    if ($debtPassedWrongly || $cashPassedWrongly) {
        $issues[] = [
            'symbol' => $company->symbol,
            'name' => $company->name,
            'current_final_status' => $aaoifi->final_status,
            'live_market_cap' => number_format($liveMarketCap),
            'historical_market_cap' => number_format($historicalMarketCap),
            'cap_inflation_factor' => round($ratio, 2) . 'x',
            'debt' => number_format($totalDebt),
            'debt_ratio_historical' => $debtRatioHistorical !== null ? round($debtRatioHistorical, 2).'%' : 'N/A',
            'debt_ratio_live' => $debtRatioLive !== null ? round($debtRatioLive, 2).'%' : 'N/A',
            'debt_passed_wrongly' => $debtPassedWrongly,
            'cash_ratio_historical' => $cashRatioHistorical !== null ? round($cashRatioHistorical, 2).'%' : 'N/A',
            'cash_ratio_live' => $cashRatioLive !== null ? round($cashRatioLive, 2).'%' : 'N/A',
            'cash_passed_wrongly' => $cashPassedWrongly,
        ];
    }
}

usort($issues, fn($a, $b) => $b['debt_passed_wrongly'] <=> $a['debt_passed_wrongly']);
echo json_encode($issues, JSON_PRETTY_PRINT);
echo "\n\nTotal affected: " . count($issues) . "\n";
