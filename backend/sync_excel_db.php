<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;

$json = file_get_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/scratch/excel_data.json');
$data = json_decode($json, true);

$updatedCount = 0;
$missingCount = 0;

foreach ($data as $row) {
    if (empty($row['__EMPTY']) || $row['__EMPTY'] === 'Company') continue;
    
    $ticker = explode(' ', trim($row['__EMPTY']))[0];
    if (strlen($ticker) < 2) continue;

    $excelDebt = is_numeric($row['__EMPTY_1'] ?? null) ? (float)$row['__EMPTY_1'] : null;
    $excelCash = is_numeric($row['__EMPTY_3'] ?? null) ? (float)$row['__EMPTY_3'] : null;
    $excelImpure = is_numeric($row['__EMPTY_5'] ?? null) ? (float)$row['__EMPTY_5'] : null;
    
    $excelVerdict = strtolower(trim($row['__EMPTY_7'] ?? ''));
    if ($excelVerdict === 'fail' || $excelVerdict === 'not ok') $excelVerdict = 'non-halal';
    if ($excelVerdict === 'pass' || $excelVerdict === 'ok') $excelVerdict = 'halal';

    $company = Company::where('symbol', $ticker)->first();
    if (!$company) {
        if (ctype_upper($ticker)) {
            echo "Skipping $ticker (Not found in DB)\n";
            $missingCount++;
        }
        continue;
    }

    // Update AAOIFI Screening
    $screening = AaoifiScreening::firstOrNew(['company_id' => $company->id]);
    if ($excelDebt !== null) $screening->debt_ratio = $excelDebt;
    if ($excelCash !== null) $screening->cash_ratio = $excelCash;
    if ($excelImpure !== null) $screening->impermissible_income_ratio = $excelImpure;
    if ($excelVerdict !== '' && !str_contains($excelVerdict, 'n/a') && !str_contains($excelVerdict, 'needs')) {
        $screening->final_status = $excelVerdict;
    }
    $screening->save();

    // Update StockStatus Override
    if ($excelVerdict !== '' && !str_contains($excelVerdict, 'n/a') && !str_contains($excelVerdict, 'needs')) {
        $status = StockStatus::firstOrNew(['company_id' => $company->id]);
        if (!$status->exists) {
            $status->symbol = $ticker;
        }
        $status->status = $excelVerdict;
        $status->reason = "Audited and verified from official manual screening sheet (August 2026). Corrected for automated parser inaccuracies such as Letters of Credit and volatile live Market Caps.";
        $status->save();
    }

    $updatedCount++;
}

echo "Successfully updated $updatedCount companies in the database.\n";
echo "Missed $missingCount companies not present in the DB.\n";
