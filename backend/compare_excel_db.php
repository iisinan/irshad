<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

$json = file_get_contents(__DIR__ . '/scratch/excel_data.json');
$data = json_decode($json, true);

$discrepancies = [];

foreach ($data as $row) {
    if (!isset($row['__EMPTY']) || strpos($row['__EMPTY'], '—') === false) continue;
    if ($row['__EMPTY'] === 'Company') continue;

    $ticker = trim(explode('—', $row['__EMPTY'])[0]);
    
    // Some values might be string like "#VALUE!" or "0.0"
    $excelDebt = is_numeric($row['__EMPTY_1'] ?? null) ? round($row['__EMPTY_1'] * 100, 4) : null;
    $excelCash = is_numeric($row['__EMPTY_3'] ?? null) ? round($row['__EMPTY_3'] * 100, 4) : null;
    $excelImpure = is_numeric($row['__EMPTY_5'] ?? null) ? round($row['__EMPTY_5'] * 100, 4) : null;
    
    $excelVerdict = strtolower(trim($row['__EMPTY_7'] ?? ''));
    if ($excelVerdict === 'fail') $excelVerdict = 'non-halal';
    if ($excelVerdict === 'pass') $excelVerdict = 'halal';

    $company = Company::where('symbol', $ticker)->first();
    if (!$company) {
        $discrepancies[] = "[$ticker] Not found in DB.";
        continue;
    }

    $screening = AaoifiScreening::where('company_id', $company->id)->first();
    if (!$screening) {
        $discrepancies[] = "[$ticker] No screening in DB.";
        continue;
    }

    $dbDebt = round((float)$screening->debt_ratio, 4);
    $dbCash = round((float)$screening->cash_ratio, 4);
    $dbImpure = round((float)$screening->impermissible_income_ratio, 4);
    $dbVerdict = strtolower($screening->final_status);

    $diffs = [];
    if ($excelDebt !== null && abs($excelDebt - $dbDebt) > 0.05) {
        $diffs[] = "Debt: Excel $excelDebt vs DB $dbDebt";
    }
    if ($excelCash !== null && abs($excelCash - $dbCash) > 0.05) {
        $diffs[] = "Cash: Excel $excelCash vs DB $dbCash";
    }
    if ($excelImpure !== null && abs($excelImpure - $dbImpure) > 0.05) {
        $diffs[] = "Impure: Excel $excelImpure vs DB $dbImpure";
    }
    if ($excelVerdict !== $dbVerdict) {
        $diffs[] = "Verdict: Excel $excelVerdict vs DB $dbVerdict";
    }

    if (!empty($diffs)) {
        $discrepancies[] = "[$ticker] " . implode(" | ", $diffs);
    }
}

if (empty($discrepancies)) {
    echo "No discrepancies found!\n";
} else {
    echo "Discrepancies found:\n";
    foreach ($discrepancies as $d) {
        echo $d . "\n";
    }
}
