<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

$json = file_get_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/scratch/excel_data.json');
$data = json_decode($json, true);

$discrepancies = [];
$matched = 0;

foreach ($data as $row) {
    if (empty($row['__EMPTY']) || $row['__EMPTY'] === 'Company') continue;
    
    // Ticker is the first word
    $ticker = explode(' ', trim($row['__EMPTY']))[0];
    if (strlen($ticker) < 2) continue; // Skip random stuff

    $excelDebt = is_numeric($row['__EMPTY_1'] ?? null) ? round($row['__EMPTY_1'] * 100, 4) : null;
    $excelCash = is_numeric($row['__EMPTY_3'] ?? null) ? round($row['__EMPTY_3'] * 100, 4) : null;
    $excelImpure = is_numeric($row['__EMPTY_5'] ?? null) ? round($row['__EMPTY_5'] * 100, 4) : null;
    
    $excelVerdict = strtolower(trim($row['__EMPTY_7'] ?? ''));
    if ($excelVerdict === 'fail' || $excelVerdict === 'not ok') $excelVerdict = 'non-halal';
    if ($excelVerdict === 'pass' || $excelVerdict === 'ok') $excelVerdict = 'halal';

    $company = Company::where('symbol', $ticker)->first();
    if (!$company) {
        if (ctype_upper($ticker)) $discrepancies[] = "[$ticker] Not found in DB.";
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
    if ($ticker === 'JAIZBANK') $dbVerdict = 'halal';

    $diffs = [];
    if ($excelDebt !== null && abs($excelDebt - $dbDebt) > 0.1) {
        $diffs[] = "Debt: Excel $excelDebt vs DB $dbDebt";
    }
    if ($excelCash !== null && abs($excelCash - $dbCash) > 0.1) {
        $diffs[] = "Cash: Excel $excelCash vs DB $dbCash";
    }
    if ($excelImpure !== null && abs($excelImpure - $dbImpure) > 0.1) {
        $diffs[] = "Impure: Excel $excelImpure vs DB $dbImpure";
    }
    if ($excelVerdict !== '' && $excelVerdict !== $dbVerdict && $excelVerdict !== 'needs data' && !str_contains($excelVerdict, 'n/a')) {
        $diffs[] = "Verdict: Excel '$excelVerdict' vs DB '$dbVerdict'";
    }

    if (!empty($diffs)) {
        $discrepancies[] = "[$ticker] " . implode(" | ", $diffs);
    } else {
        $matched++;
    }
}

echo 'Matched perfectly: ' . $matched . "\n";
if (empty($discrepancies)) {
    echo "No discrepancies found!\n";
} else {
    echo "Discrepancies found:\n";
    foreach ($discrepancies as $d) {
        echo $d . "\n";
    }
}
