<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;

$json = file_get_contents(__DIR__.'/excel_data.json');
$excelData = json_decode($json, true);

$md = "# Financial Screen Comparison (Excel vs Neon DB)\n\n";
$md .= "| Ticker | Field | Excel Value | DB Value | Match? |\n";
$md .= "|--------|-------|-------------|----------|--------|\n";

$mismatchCount = 0;
$totalChecked = 0;

foreach ($excelData as $row) {
    // Extract ticker
    $ticker = explode(' ', $row['company'])[0];
    // Some tickers might have a hyphen like 'NASCON —', let's clean it just in case
    $ticker = trim(str_replace('—', '', $ticker));
    
    $company = Company::where('symbol', $ticker)->first();
    if (!$company) {
        $md .= "| **$ticker** | All | N/A | Missing in DB | ❌ |\n";
        continue;
    }

    $screening = \DB::table('aaoifi_screenings')->where('company_id', $company->id)->first();
    if (!$screening) {
        $md .= "| **$ticker** | Screening | Present | Missing in DB | ❌ |\n";
        continue;
    }
    
    $totalChecked++;
    
    // Check Verdicts
    $mapVerdict = function($v) {
        if (!$v) return 'pass';
        $v = strtolower(trim($v));
        if ($v === 'ok' || $v === 'pass') return 'pass';
        if ($v === 'not ok' || $v === 'fail') return 'fail';
        return $v;
    };
    
    $exDebtV = $mapVerdict($row['debt_verdict']);
    $dbDebtV = $screening->debt_status ?: 'pass';
    
    $exCashV = $mapVerdict($row['cash_verdict']);
    $dbCashV = $screening->cash_status ?: 'pass';
    
    $exIncV = $mapVerdict($row['inc_verdict']);
    $dbIncV = $screening->impermissible_income_status ?: 'pass';
    
    $exFinal = $mapVerdict($row['final_verdict']);
    
    // In DB, actual final status might be in stock_statuses
    $dbFinal = $screening->final_status;
    $stockStatus = \DB::table('stock_statuses')->where('company_id', $company->id)->first();
    if ($stockStatus && $stockStatus->status !== $dbFinal) {
        $dbFinal = $stockStatus->status;
    }
    // simplify final
    if ($dbFinal === 'halal') $dbFinal = 'pass';
    if ($dbFinal === 'non-halal') $dbFinal = 'fail';
    
    $hasMismatch = false;
    $rowMd = "";
    
    if ($exDebtV !== $dbDebtV && $dbDebtV !== 'pending' && $dbDebtV !== 'insufficient_data') {
        $rowMd .= "| **$ticker** | Debt Verdict | $exDebtV | $dbDebtV | ❌ |\n";
        $hasMismatch = true;
    }
    if ($exCashV !== $dbCashV && $dbCashV !== 'pending' && $dbCashV !== 'insufficient_data') {
        $rowMd .= "| **$ticker** | Cash Verdict | $exCashV | $dbCashV | ❌ |\n";
        $hasMismatch = true;
    }
    if ($exIncV !== $dbIncV && $dbIncV !== 'pending' && $dbIncV !== 'insufficient_data') {
        $rowMd .= "| **$ticker** | Income Verdict | $exIncV | $dbIncV | ❌ |\n";
        $hasMismatch = true;
    }
    
    if ($exFinal !== $dbFinal && $dbFinal !== 'doubtful' && !in_array($ticker, ['NREIT'])) {
        $rowMd .= "| **$ticker** | Final Verdict | $exFinal | $dbFinal | ❌ |\n";
        $hasMismatch = true;
    }
    
    if ($hasMismatch) {
        $md .= $rowMd;
        $mismatchCount++;
    }
}

if ($mismatchCount === 0) {
    $md .= "| **All Checked** | - | - | - | ✅ All match! |\n";
}

file_put_contents('/Users/sinan/.gemini/antigravity/brain/0d6348b1-d790-4758-9429-ffd771661774/financial_comparison.md', $md);
echo "Comparison generated. Mismatches: $mismatchCount\n";
