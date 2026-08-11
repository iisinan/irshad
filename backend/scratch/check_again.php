<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$excel_failed = ["ABBEYBANK", "ACCESSCORP", "AFRINSURE", "AFRIPRUD", "AIICO", "AVAIF", "CHAMPION", "CMFC", "CNIF", "CONHALLPLC", "CORNERST", "CUSTODIAN", "ELLAHLAKES", "ETI", "FCMB", "FIDELITYBK", "FIRSTHOLDCO", "FTGINSURE", "GOLDBREW", "GTCO", "GUINEAINS", "GUINNESS", "IKEJAHOTEL", "INFINITY", "INTBREW", "INTENEGINS", "LASACO", "LINKASSURE", "LIVINGTRUST", "MANSARD", "MBENEFIT", "MOFIREIF", "NB", "NEM", "NIDF", "NPFMCRFBK", "NSLTECH", "PRESTIGE", "REGALINS", "ROYALEX", "SOVRENINS", "STACO", "STANBIC", "STERLINGNG", "SUNUASSUR", "TRANSCOHOT", "UBA", "UCAP", "UNITYBNK", "UNIVINSURE", "VERITASKAP", "VFDGROUP", "WAPIC", "WEMABANK", "ZENITHBANK"];

$mismatches = [];
foreach ($excel_failed as $symbol) {
    $c = App\Models\Company::where('symbol', $symbol)->first();
    if ($c) {
        if ($c->current_status !== 'non-halal') {
            $mismatches[] = [
                'symbol' => $symbol,
                'current_status' => $c->current_status
            ];
        }
    } else {
        $mismatches[] = ['symbol' => $symbol, 'current_status' => 'NOT FOUND'];
    }
}
echo json_encode($mismatches, JSON_PRETTY_PRINT);
