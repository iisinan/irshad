<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$json = file_get_contents('/tmp/irshad_fin_screen.json');
$data = json_decode($json, true);

// Skip first 3 rows
$rows = array_slice($data, 3);

$mismatches = [];

foreach ($rows as $row) {
    if (empty($row['Unnamed: 1'])) continue;

    $companyString = $row['Unnamed: 1'];
    // Extract symbol
    $symbolParts = explode(' —', $companyString);
    if (count($symbolParts) < 2) {
        $symbolParts = explode(' -', $companyString);
    }
    $symbol = trim($symbolParts[0]);

    if (!$symbol) continue;

    $debtRatioExcel = (float)$row['Unnamed: 2'] * 100;
    $cashRatioExcel = (float)$row['Unnamed: 4'] * 100;
    $finIncRatioExcel = (float)$row['Unnamed: 6'] * 100;
    $verdictExcel = strtolower(trim($row['Unnamed: 8'])); // e.g. "fail", "pass"
    
    // In excel: "FAIL" or "PASS" (which usually means non-compliant or halal)
    if ($verdictExcel == 'pass') $verdictExcel = 'halal';
    if ($verdictExcel == 'fail') $verdictExcel = 'non-compliant';

    $company = \App\Models\Company::where('symbol', $symbol)->first();

    if (!$company) {
        $mismatches[] = [
            'symbol' => $symbol,
            'issue' => 'Company not found in DB',
        ];
        continue;
    }

    $screening = $company->aaoifiScreening;

    if (!$screening) {
        $mismatches[] = [
            'symbol' => $symbol,
            'issue' => 'No AAOIFI screening record in DB',
        ];
        continue;
    }

    // Since DB stores ratio, let's compare them
    $debtDb = (float)$screening->debt_ratio;
    $cashDb = (float)$screening->cash_ratio;
    $incDb = (float)$screening->impermissible_income_ratio ?? (float)$screening->impure_ratio;
    $verdictDb = strtolower($screening->final_status);

    $diffs = [];

    if (abs($debtDb - $debtRatioExcel) > 0.05) {
        $diffs[] = "Debt Ratio: Excel=".round($debtRatioExcel,2).", DB=".round($debtDb,2);
    }
    if (abs($cashDb - $cashRatioExcel) > 0.05) {
        $diffs[] = "Cash Ratio: Excel=".round($cashRatioExcel,2).", DB=".round($cashDb,2);
    }
    if (abs($incDb - $finIncRatioExcel) > 0.05) {
        $diffs[] = "Inc Ratio: Excel=".round($finIncRatioExcel,2).", DB=".round($incDb,2);
    }
    if ($verdictDb !== $verdictExcel && !($verdictDb == 'doubtful' && $verdictExcel == 'non-compliant')) { 
        // Excel doesn't have "doubtful" so it might just be PASS/FAIL
        $diffs[] = "Verdict: Excel={$verdictExcel}, DB={$verdictDb}";
    }

    if (!empty($diffs)) {
        $mismatches[] = [
            'symbol' => $symbol,
            'diffs' => implode(' | ', $diffs)
        ];
    }
}

echo "Total mismatches found: " . count($mismatches) . "\n";
foreach ($mismatches as $m) {
    echo $m['symbol'] . ": " . ($m['issue'] ?? $m['diffs']) . "\n";
}
