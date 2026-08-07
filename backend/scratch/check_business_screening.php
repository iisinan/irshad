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

echo "CHECKING BUSINESS ACTIVITY SCREENING STATUS IN DATABASE\n";
echo str_repeat("=", 90) . "\n\n";

$passCount = 0;
$failCount = 0;
$mismatches = [];
$noRecordCount = 0;

foreach ($halalTickers as $ticker) {
    $company = $companies->get($ticker);
    if (!$company) {
        continue; // handled elsewhere
    }

    $aaoifi = $company->aaoifiScreening;
    
    if (!$aaoifi) {
        $noRecordCount++;
        $mismatches[] = "{$ticker}: NO AAOIFI RECORD";
        continue;
    }

    $businessStatus = $aaoifi->business_status; // Should be 'pass' or 'fail'
    
    if ($businessStatus === 'pass') {
        $passCount++;
    } else {
        $failCount++;
        $mismatches[] = "{$ticker}: Failed business activity screening (DB status: {$businessStatus}) - Reason: " . substr($aaoifi->business_reasoning, 0, 150);
    }
}

echo "SUMMARY:\n";
echo "  ✅ Match (Excel=PASS, DB business_status=pass): {$passCount}\n";
echo "  ⚠️  Mismatches (Excel=PASS, DB business_status=fail): {$failCount}\n";
echo "  ❓ No AAOIFI Record: {$noRecordCount}\n\n";

if (count($mismatches) > 0) {
    echo "MISMATCH DETAILS:\n";
    foreach ($mismatches as $mismatch) {
        echo "  - {$mismatch}\n";
    }
}
