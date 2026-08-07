<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$mismatchedTickers = [
    'ABCTRANS', 'AIRTELAFRI', 'BAPLC', 'BERGER', 'CAVERTON', 'CHAMS', 'CONOIL',
    'DANGSUGAR', 'ETERNA', 'ETRANZACT', 'GEREGU', 'HONYFLOUR', 'JBERGER', 'MAYBAKER',
    'MEYER', 'MORISON', 'MULTIVERSE', 'NASCON', 'NNFM', 'OANDO', 'RTBRISCOE',
    'TOTAL', 'UACN', 'UNILEVER', 'UNIONDICON', 'UPL', 'VITAFOAM', 'NAHCO'
];

$companies = Company::whereIn('symbol', $mismatchedTickers)->with('aaoifiScreening')->get();

$missingData = [];
$legitFails = [];
$discrepancies = []; // AAOIFI says halal, but DB says something else, despite having valid data

foreach ($companies as $company) {
    $aaoifi = $company->aaoifiScreening;
    if (!$aaoifi) continue;
    
    $finData = $aaoifi->financial_data_used ?? [];
    if (is_string($finData)) $finData = json_decode($finData, true);
    
    $rev = $finData['total_revenue'] ?? 0;
    $debt = $finData['total_debt'] ?? 0;
    $cash = $finData['cash'] ?? 0;
    
    $isMissing = ($rev == 0 && $debt == 0 && $cash == 0);
    
    if ($isMissing) {
        $missingData[] = $company->symbol;
    } else {
        if ($aaoifi->final_status === 'fail' || $aaoifi->final_status === 'non-halal') {
            $legitFails[] = $company->symbol;
        } else if ($aaoifi->final_status === 'halal') {
            $discrepancies[] = $company->symbol;
        }
    }
}

echo "1. MISSING FINANCIAL DATA (Total Revenue, Debt, and Cash are all 0):\n";
echo implode(", ", $missingData) . "\n\n";

echo "2. LEGITIMATE FAILS (Financial ratios correctly exceeded AAOIFI limits):\n";
echo implode(", ", $legitFails) . "\n\n";

echo "3. HALAL BUT MISMATCHED IN DB (Good data, AAOIFI=halal, DB=non-halal/doubtful):\n";
echo implode(", ", $discrepancies) . "\n\n";
