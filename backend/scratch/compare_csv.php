<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

$csvFile = '/Users/sinan/Herd/irshad/backend/scratch/stocks_financial_data.csv';
$handle = fopen($csvFile, 'r');
$header = fgetcsv($handle);

$mismatches = [];

while (($data = fgetcsv($handle)) !== FALSE) {
    $row = array_combine($header, $data);
    $symbol = trim($row['Symbol']);
    
    $c = Company::where('symbol', $symbol)->first();
    if (!$c) {
        $mismatches[$symbol] = ["Company not found in DB"];
        continue;
    }
    
    $aaoifi = AaoifiScreening::where('company_id', $c->id)->first();
    if (!$aaoifi) {
        $mismatches[$symbol] = ["AAOIFI screening record not found in DB"];
        continue;
    }
    
    $raw = is_string($aaoifi->financial_data_used) ? json_decode($aaoifi->financial_data_used, true) : $aaoifi->financial_data_used;
    if (!$raw) {
        $raw = [];
    }

    $diffs = [];
    
    // Compare Market Cap
    $db_mc = $raw['market_cap'] ?? $c->market_cap ?? 0;
    if (abs(floatval($row['Market Cap']) - floatval($db_mc)) > 1) {
        $diffs[] = "Market Cap mismatch: CSV=" . $row['Market Cap'] . ", DB=" . $db_mc;
    }
    
    // Compare Assets
    $db_ta = $raw['total_assets'] ?? 0;
    if (abs(floatval($row['Total Assets']) - floatval($db_ta)) > 1) {
        $diffs[] = "Total Assets mismatch: CSV=" . $row['Total Assets'] . ", DB=" . $db_ta;
    }
    
    // Compare Debt
    $db_td = $raw['total_debt'] ?? 0;
    if (abs(floatval($row['Total Debt']) - floatval($db_td)) > 1) {
        $diffs[] = "Total Debt mismatch: CSV=" . $row['Total Debt'] . ", DB=" . $db_td;
    }
    
    // Compare Cash
    $db_cash = $raw['cash'] ?? 0;
    if (abs(floatval($row['Cash']) - floatval($db_cash)) > 1) {
        $diffs[] = "Cash mismatch: CSV=" . $row['Cash'] . ", DB=" . $db_cash;
    }
    
    // Compare Interest Income
    $db_ii = $raw['interest_income'] ?? 0;
    if (abs(floatval($row['Interest Income']) - floatval($db_ii)) > 1) {
        $diffs[] = "Interest Income mismatch: CSV=" . $row['Interest Income'] . ", DB=" . $db_ii;
    }
    
    // Compare Total Revenue
    $db_tr = $raw['total_revenue'] ?? 0;
    if (abs(floatval($row['Total Revenue']) - floatval($db_tr)) > 1) {
        $diffs[] = "Total Revenue mismatch: CSV=" . $row['Total Revenue'] . ", DB=" . $db_tr;
    }
    
    // Compare Justification
    $db_just_raw = $aaoifi->business_reasoning;
    $db_just_parsed = is_string($db_just_raw) ? json_decode($db_just_raw, true) : $db_just_raw;
    $db_just = $db_just_parsed['summary'] ?? $db_just_raw;
    
    if (trim($row['Business Reasoning / Justification']) !== trim($db_just)) {
        $diffs[] = "Reasoning mismatch: CSV=[" . $row['Business Reasoning / Justification'] . "], DB=[" . $db_just . "]";
    }
    
    if (!empty($diffs)) {
        $mismatches[$symbol] = $diffs;
    }
}

fclose($handle);

$output = "# Database vs CSV Mismatch Report\n\n";
if (empty($mismatches)) {
    $output .= "No mismatches found between the DB and the CSV!\n";
} else {
    foreach ($mismatches as $symbol => $diffs) {
        $output .= "### $symbol\n";
        foreach ($diffs as $diff) {
            $output .= "- $diff\n";
        }
        $output .= "\n";
    }
}

file_put_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/comparison_report.md', $output);
echo "Report generated successfully.";
