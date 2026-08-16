<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$symbolsFromImage = [
    'ABBEYBANC', 'ACCESSCORP', 'AFRINSURE', 'AFRIPRUD', 'AIICO',
    'AVAIF', 'AVACAP', 'CHAMPION', 'CMFC', 'CMF', 'CONHALLPLC',
    'CORNERST', 'CUSTODIAN', 'ELLAHLAKES', 'ETI', 'FCMB',
    'FIDELITYBK', 'FIRSTHOLDCO', 'FBNH', 'FTNINSURE', 'GOLDBREW', 'GTCO',
    'GUINEAINS', 'GUINNESS', 'IKEJAHOTEL', 'INFINITY', 'INTBREW',
    'INTENEGINS', 'LASACO', 'LINKASSURE', 'LIVESTOCK', 'LIVINGTRUST',
    'MANSARD', 'MBENEFIT', 'MCFIREIF', 'NB', 'NEM', 'NIDF',
    'NPFMCRFBK', 'NSLTECH', 'PRESTIGE', 'REGALINS', 'ROYALEX',
    'SOVRENINS', 'STACO', 'STANBIC', 'STERLINGNG', 'SUNUASSUR',
    'TRANSCOHOT', 'UBA', 'UCAP', 'UNITYBNK', 'UNIVINSURE',
    'VERITASKAP', 'VFDGROUP', 'WAPIC', 'WEMABANK', 'ZENITHBANK',
    'ZICHIS', 'VETGRIF30', 'STANBICETF30', 'VETBANK', 'GREENWETF',
    'VSPBONDETF', 'SIAMLETF40'
];

use App\Models\Company;

$results = [];
foreach ($symbolsFromImage as $symbol) {
    $company = Company::where('symbol', $symbol)->first();
    if ($company) {
        $results[] = [
            'symbol' => $symbol,
            'status' => $company->aaoifi_status,
        ];
    } else {
        $results[] = [
            'symbol' => $symbol,
            'status' => 'NOT_FOUND',
        ];
    }
}

echo "Results:\n";
foreach ($results as $r) {
    echo str_pad($r['symbol'], 15) . " => " . $r['status'] . "\n";
}
