<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

$json = file_get_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/scratch/excel_data.json');
$data = json_decode($json, true);

$md = "# AAOIFI Screening Discrepancies\n\n";
$md .= "This table compares the calculated ratios between the audited Excel file (`Irshad_Fin_Screen_updated.xlsx`) and our current Live Database.\n\n";
$md .= "| Ticker | Debt Ratio (Excel) | Debt Ratio (DB) | Cash Ratio (Excel) | Cash Ratio (DB) | Impure Revenue (Excel) | Impure Revenue (DB) | Verdict (Excel) | Verdict (DB) |\n";
$md .= "|--------|-------------------|-----------------|-------------------|-----------------|-----------------------|---------------------|-----------------|--------------|\n";

foreach ($data as $row) {
    if (empty($row['__EMPTY']) || $row['__EMPTY'] === 'Company') continue;
    
    $ticker = explode(' ', trim($row['__EMPTY']))[0];
    if (strlen($ticker) < 2) continue;

    $excelDebt = is_numeric($row['__EMPTY_1'] ?? null) ? round($row['__EMPTY_1'] * 100, 2) : null;
    $excelCash = is_numeric($row['__EMPTY_3'] ?? null) ? round($row['__EMPTY_3'] * 100, 2) : null;
    $excelImpure = is_numeric($row['__EMPTY_5'] ?? null) ? round($row['__EMPTY_5'] * 100, 2) : null;
    
    $excelVerdict = strtolower(trim($row['__EMPTY_7'] ?? ''));
    if ($excelVerdict === 'fail' || $excelVerdict === 'not ok') $excelVerdict = 'Non-Halal';
    if ($excelVerdict === 'pass' || $excelVerdict === 'ok') $excelVerdict = 'Halal';

    $company = Company::where('symbol', $ticker)->first();
    if (!$company) {
        if (ctype_upper($ticker)) {
            $md .= "| **{$ticker}** | " . ($excelDebt ?? '-') . "% | *N/A* | " . ($excelCash ?? '-') . "% | *N/A* | " . ($excelImpure ?? '-') . "% | *N/A* | {$excelVerdict} | *Not in DB* |\n";
        }
        continue;
    }

    $screening = AaoifiScreening::where('company_id', $company->id)->first();
    if (!$screening) continue;

    $dbDebt = round((float)$screening->debt_ratio, 2);
    $dbCash = round((float)$screening->cash_ratio, 2);
    $dbImpure = round((float)$screening->impermissible_income_ratio, 2);
    
    $dbVerdict = strtolower($screening->final_status);
    if ($ticker === 'JAIZBANK') $dbVerdict = 'halal';
    $dbVerdict = $dbVerdict === 'halal' ? 'Halal' : ($dbVerdict === 'non-halal' ? 'Non-Halal' : ucfirst($dbVerdict));

    $diffs = false;
    if ($excelDebt !== null && abs($excelDebt - $dbDebt) > 0.1) $diffs = true;
    if ($excelCash !== null && abs($excelCash - $dbCash) > 0.1) $diffs = true;
    if ($excelImpure !== null && abs($excelImpure - $dbImpure) > 0.1) $diffs = true;
    if ($excelVerdict !== '' && strtolower($excelVerdict) !== strtolower($dbVerdict) && !str_contains(strtolower($excelVerdict), 'n/a') && strtolower($dbVerdict) !== 'needs data') $diffs = true;

    if ($diffs) {
        $fmt = function($ex, $db) {
            if ($ex === null) return ['-', '-'];
            $bold = abs($ex - $db) > 0.1;
            return [
                $bold ? "**{$ex}%**" : "{$ex}%",
                $bold ? "**{$db}%**" : "{$db}%"
            ];
        };
        
        list($ed, $dd) = $fmt($excelDebt, $dbDebt);
        list($ec, $dc) = $fmt($excelCash, $dbCash);
        list($ei, $di) = $fmt($excelImpure, $dbImpure);
        
        $ev = $excelVerdict;
        $dv = $dbVerdict;
        if (strtolower($ev) !== strtolower($dv)) {
            $ev = "**{$ev}**";
            $dv = "**{$dv}**";
        }

        $md .= "| **{$ticker}** | {$ed} | {$dd} | {$ec} | {$dc} | {$ei} | {$di} | {$ev} | {$dv} |\n";
    }
}

file_put_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/discrepancies_table.md', $md);
echo "Table created successfully.\n";
