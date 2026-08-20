<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

$tickers = [
    'ABBEYBANK',
    'ACCESSCORP',
    'AFRINSURE',
    'AFRIPRUD',
    'AIICO',
    'AVAIF',
    'AVACAP',
    'CHAMPION',
    'CMFC',
    'CNIF',
    'CONHALLPLC',
    'CORNERST',
    'CUSTODIAN',
    'ELLAHLAKES',
    'ETI',
    'FCMB',
    'FIDELITYBK',
    'FIRSTHOLDCO',
    'FTGINSURE',
    'GOLDBREW',
    'GTCO',
    'GUINEAINS',
    'GUINNESS',
    'IKEJAHOTEL',
    'INFINITY',
    'INTBREW',
    'INTENEGINS',
    'LASACO',
    'LINKASSURE',
    'LIVESTOCK',
    'LIVINGTRUST',
    'MANSARD',
    'MBENEFIT',
    'MOFIREIF',
    'NB',
    'NEM',
    'NIDF',
    'NPFMCRFBK',
    'NSLTECH',
    'PRESTIGE',
    'REGALINS',
    'ROYALEX',
    'SOVRENINS',
    'STACO',
    'STANBIC',
    'STERLINGNG',
    'SUNUASSUR',
    'TRANSCOHOT',
    'UBA',
    'UCAP',
    'UNITYBNK',
    'UNIVINSURE',
    'VERITASKAP',
    'VFDGROUP',
    'WAPIC',
    'WEMABANK',
    'ZENITHBANK',
    'ZICHIS',
    'VETGRIF30',
    'STANBICETF30',
    'VETBANK',
    'GREENWETF',
    'VSPBONDETF',
    'SIAMLETF40'
];

$count = 0;
foreach ($tickers as $symbol) {
    $company = Company::where('symbol', $symbol)->first();
    if ($company) {
        $company->current_status = 'non-compliant';
        $company->save();

        $screening = AaoifiScreening::firstOrNew(['company_id' => $company->id]);
        $screening->final_status = 'non-compliant';
        $screening->business_status = 'fail';
        
        $screening->business_reasoning = json_encode(['summary' => 'Interest-based lending/deposits (riba).']);
        
        // Keep or set default financial data safely
        if ($screening->debt_ratio === null) $screening->debt_ratio = 0;
        if ($screening->debt_status === null) $screening->debt_status = 'pass';
        if ($screening->cash_ratio === null) $screening->cash_ratio = 0;
        if ($screening->cash_status === null) $screening->cash_status = 'pass';
        if ($screening->impermissible_income_ratio === null) $screening->impermissible_income_ratio = 0;
        if ($screening->impermissible_income_status === null) $screening->impermissible_income_status = 'pass';

        $screening->save();
        $count++;
    } else {
        echo "Ticker not found: $symbol\n";
    }
}

echo "Successfully updated $count companies to non-compliant (failed business activity).\n";
