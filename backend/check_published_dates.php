<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$symbols = [
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

$missing = [];
$not_found = [];

foreach ($symbols as $symbol) {
    $company = \App\Models\Company::where('symbol', $symbol)->first();
    if (!$company) {
        $not_found[] = $symbol;
        continue;
    }

    $fin = $company->financials()->latest()->first();
    $scr = $company->aaoifiScreening;

    $publishedDate = null;
    if ($scr && $scr->published_date) {
        $publishedDate = $scr->published_date;
    } elseif ($fin && $fin->published_date) {
        $publishedDate = $fin->published_date;
    }

    if (!$publishedDate) {
        $missing[] = $symbol;
    }
}

echo "Total checked: " . count($symbols) . "\n";
echo "Not found in DB: " . implode(', ', $not_found) . "\n";
echo "Missing Published Date: " . implode(', ', $missing) . "\n";
