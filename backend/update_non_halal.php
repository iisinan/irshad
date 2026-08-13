<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$symbols = [
    'ABBEYBANK', 'ACCESSCORP', 'AFRINSURE', 'AFRIPRUD', 'AIICO', 'AVAIF', 'AVACAP',
    'CHAMPION', 'CMFC', 'CNIF', 'CONHALLPLC', 'CORNERST', 'CUSTODIAN', 'ELLAHLAKES',
    'ETI', 'FCMB', 'FIDELITYBK', 'FIRSTHOLDCO', 'FTGINSURE', 'GOLDBREW', 'GTCO',
    'GUINEAINS', 'GUINNESS', 'IKEJAHOTEL', 'INFINITY', 'INTBREW', 'INTENEGINS',
    'LASACO', 'LINKASSURE', 'LIVESTOCK', 'LIVINGTRUST', 'MANSARD', 'MBENEFIT',
    'MOFIREIF', 'NB', 'NEM', 'NIDF', 'NPFMCRFBK', 'NSLTECH', 'PRESTIGE', 'REGALINS',
    'ROYALEX', 'SOVRENINS', 'STACO', 'STANBIC', 'STERLINGNG', 'SUNUASSUR',
    'TRANSCOHOT', 'UBA', 'UCAP', 'UNITYBNK', 'UNIVINSURE', 'VERITASKAP', 'VFDGROUP',
    'WAPIC', 'WEMABANK', 'ZENITHBANK', 'ZICHIS', 'VETGRIF30', 'STANBICETF30',
    'VETBANK', 'GREENWETF', 'VSPBONDETF', 'SIAMLETF40'
];

$count = 0;
foreach ($symbols as $symbol) {
    $company = App\Models\Company::where('symbol', $symbol)->first();
    if ($company) {
        $company->update(['current_status' => 'non-halal']);
        Illuminate\Support\Facades\DB::table('stock_statuses')->updateOrInsert(
            ['company_id' => $company->id],
            [
                'status' => 'non-halal', 
                'reason' => 'Manually classified as Shariah non-compliant per scholar override.', 
                'verified_by_scholar' => true, 
                'last_updated' => now(), 
                'updated_at' => now()
            ]
        );
        Illuminate\Support\Facades\Cache::forget('stocks.show.' . $symbol);
        Illuminate\Support\Facades\Cache::forget('stocks.show.' . $symbol . '_v2');
        $count++;
    } else {
        echo "Warning: Company $symbol not found.\n";
    }
}
Illuminate\Support\Facades\Cache::tags(['stocks'])->flush();
echo "Updated $count non-halal stocks.\n";
