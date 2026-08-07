<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$halalTickers = [
    'ABCTRANS', 'ACADEMY', 'AIRTELAFRI', 'ALEX', 'ARADEL', 'AUSTINLAZ', 'BAPLC', 'BERGER',
    'BUACEMENT', 'BUAFOODS', 'CADBURY', 'CAP', 'CAVERTON', 'CHAMS', 'CHELLARAM', 'CONOIL',
    'CUTIX', 'CWG', 'DANGCEM', 'DANGSUGAR', 'EKOCORP', 'ENAMELWA', 'ETERNA', 'ETRANZACT',
    'EUNISELL', 'FIDSON', 'FTNCOCOA', 'GEREGU', 'HBMNG', 'HONYFLOUR', 'IMG', 'JAIZBANK',
    'JAPAULGOLD', 'JBERGER', 'JOHNHOLT', 'JULI', 'LEARNAFRCA', 'LEGENDINT', 'MAYBAKER',
    'MCNICHOLS', 'MECURE', 'MEYER', 'MORISON', 'MTNN', 'MULTITREX', 'MULTIVERSE', 'NASCON',
    'NEIMETH', 'NESTLE', 'NNFM', 'NREIT', 'OANDO', 'OKOMUOIL', 'OMATEK', 'PHARMDEKO',
    'PREMPAINTS', 'PRESCO', 'PZ', 'REDSTAREX', 'RONCHESS', 'RTBRISCOE', 'SCOA', 'SEPLAT',
    'SKYAVN', 'THOMASWY', 'TIP', 'TOTAL', 'TRANSEXPR', 'TRANSPOWER', 'TRIPPLEG', 'UACN',
    'UNILEVER', 'UNIONDICON', 'UPDC', 'UPL', 'VITAFOAM', 'NAHCO', 'LOTUSHAL15'
];

$companies = Company::whereIn('symbol', $halalTickers)
    ->with('aaoifiScreening')
    ->get()
    ->keyBy('symbol');

$notInDb = array_diff($halalTickers, $companies->keys()->toArray());

echo "COMPARISON: EXCEL HALAL vs NEON DB\n";
echo str_repeat("=", 90) . "\n\n";

$matches = 0;
$mismatches = [];

foreach ($halalTickers as $ticker) {
    $company = $companies->get($ticker);
    if (!$company) {
        continue;
    }

    $dbStatus = $company->current_status ?? 'null';
    $aaoifi = $company->aaoifiScreening;
    $aaoifiStatus = $aaoifi ? $aaoifi->final_status : 'no aaoifi record';
    
    // For halal, it could be 'halal' or 'compliant' depending on DB enum. Let's assume 'halal'.
    $icon = ($dbStatus === 'halal') ? '✅ MATCH' : '⚠️  MISMATCH';
    if ($dbStatus === 'halal') {
        $matches++;
    } else {
        $mismatches[] = $ticker . ' (DB=' . $dbStatus . ', AAOIFI=' . $aaoifiStatus . ')';
    }
}

echo str_repeat("=", 90) . "\n";
echo "SUMMARY:\n";
echo "  ✅ Match (both halal): " . $matches . "\n";
echo "  ⚠️  Mismatches (Excel=halal, DB differs): " . count($mismatches) . "\n";
foreach ($mismatches as $m) echo "     - " . $m . "\n";
echo "  ❓ Not in DB: " . count($notInDb) . "\n";
foreach ($notInDb as $m) echo "     - " . $m . "\n";
