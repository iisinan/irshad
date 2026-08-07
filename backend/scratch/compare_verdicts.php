<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

// Non-halal tickers from the Excel file
$excelNonHalal = [
    'ABBEYBANK' => 'Conventional bank - interest-based lending/deposits (riba).',
    'ACCESSCORP' => 'Conventional bank - interest-based lending/deposits (riba).',
    'AIICO' => 'Conventional insurance - riba/gharar in contract structure.',
    'CORNERST' => 'Conventional insurance - riba/gharar in contract structure.',
    'CUSTODIAN' => 'Conventional insurance - riba/gharar in contract structure.',
    'ETI' => 'Conventional bank (Ecobank Transnational) - interest-based lending/deposits (riba).',
    'FCMB' => 'Conventional bank - interest-based lending/deposits (riba).',
    'FIDELITYBK' => 'Conventional bank - interest-based lending/deposits (riba).',
    'FIRSTHOLDCO' => 'Conventional bank holding co (First Bank) - interest-based lending/deposits (riba).',
    'FTGINSURE' => 'Conventional insurance - riba/gharar in contract structure.',
    'GOLDBREW' => 'Brewery (Golden Guinea Breweries) - alcohol production.',
    'GTCO' => 'Conventional bank holding co - interest-based lending/deposits (riba).',
    'GUINEAINS' => 'Conventional insurance - riba/gharar in contract structure.',
    'GUINNESS' => 'Brewery (Guinness Nigeria) - alcohol production.',
    'IKEJAHOTEL' => 'Hospitality group operating Federal Palace Hotels & Casino - gambling and alcohol sales are core revenue lines.',
    'INFINITY' => 'Mortgage bank - interest-based lending (riba).',
    'INTBREW' => 'Brewery (International Breweries) - alcohol production.',
    'INTENEGINS' => 'Conventional insurance - riba/gharar in contract structure.',
    'LASACO' => 'Conventional insurance - riba/gharar in contract structure.',
    'LINKASSURE' => 'Conventional insurance - riba/gharar in contract structure.',
    'LIVESTOCK' => 'The company core activities include, Piggery and pig feeds production and sale.',
    'LIVINGTRUST' => 'Mortgage bank - interest-based lending (riba).',
    'MANSARD' => 'Conventional insurance (AXA Mansard) - riba/gharar in contract structure.',
    'MBENEFIT' => 'Conventional insurance - riba/gharar in contract structure.',
    'MOFIREIF' => 'Government-backed mortgage lending - interest-bearing lending is the core product.',
    'NB' => 'Brewery (Nigerian Breweries) - alcohol production.',
    'NEM' => 'Conventional insurance - riba/gharar in contract structure.',
    'NIDF' => 'Nigeria Infrastructure Debt Fund - core business in interest-based debt investments.',
    'NPFMCRFBK' => 'Microfinance bank - interest-based lending (riba).',
    'NSLTECH' => 'Directly operates a licensed national lottery/gambling business.',
    'PRESTIGE' => 'Conventional insurance - riba/gharar in contract structure.',
    'REGALINS' => 'Conventional insurance - riba/gharar in contract structure.',
    'ROYALEX' => 'Conventional insurance - riba/gharar in contract structure.',
    'SOVRENINS' => 'Conventional insurance - riba/gharar in contract structure.',
    'STACO' => 'Conventional insurance - riba/gharar in contract structure.',
    'STANBIC' => 'Conventional bank (Stanbic IBTC) - interest-based lending/deposits (riba).',
    'STERLINGNG' => 'Conventional bank - interest-based lending/deposits (riba).',
    'SUNUASSUR' => 'Conventional insurance - riba/gharar in contract structure.',
    'TRANSCOHOT' => 'Transcorp Hilton Abuja - on-site casino and bars are core hotel amenities.',
    'UBA' => 'Conventional bank - interest-based lending/deposits (riba).',
    'UCAP' => 'United Capital - directly operates microfinance and consumer lending subsidiaries.',
    'UNITYBNK' => 'Conventional bank - interest-based lending/deposits (riba).',
    'UNIVINSURE' => 'Conventional insurance - riba/gharar in contract structure.',
    'VERITASKAP' => 'Conventional insurance - riba/gharar in contract structure.',
    'VFDGROUP' => 'Core business includes microfinance, mortgage banking, insurance brokerage - impermissible primary segments.',
    'WAPIC' => 'Conventional insurance - riba/gharar in contract structure.',
    'WEMABANK' => 'Conventional bank - interest-based lending/deposits (riba).',
    'ZENITHBANK' => 'Conventional bank - interest-based lending/deposits (riba).',
    'ZICHIS' => 'Piggery among stated business lines - categorical swine exclusion.',
    'LIVESTOCK' => 'Core activities include piggery and pig feeds production.',
    'VETGRIF30' => 'ETF - tracks NGX 30 which holds conventional banks and impermissible stocks.',
    'STANBICETF30' => 'ETF - tracks NGX 30, holds conventional banks.',
    'VETBANK' => 'ETF - tracks NGX Banking Index, basket of conventional banks.',
    'GREENWETF' => 'ETF - tracks NGX All-Share, includes impermissible companies.',
    'VSPBONDETF' => 'Sovereign Bond ETF - holds FGN bonds, generates return from interest (riba).',
    'SIAMLETF40' => 'ETF - tracks NGX Pension Index, includes conventional banks.',
];

$tickers = array_keys($excelNonHalal);

$companies = Company::whereIn('symbol', $tickers)
    ->with('aaoifiScreening')
    ->get()
    ->keyBy('symbol');

echo "COMPARISON: EXCEL VERDICTS vs NEON DATABASE\n";
echo str_repeat("=", 100) . "\n\n";

$matches = 0;
$mismatches = 0;
$notInDb = 0;

foreach ($excelNonHalal as $ticker => $excelReason) {
    $company = $companies->get($ticker);

    if (!$company) {
        echo "❓ [{$ticker}] NOT IN DATABASE\n";
        $notInDb++;
        continue;
    }

    $dbStatus = $company->current_status ?? 'null';
    $dbReason = $company->activity_reason ?? 'No reason stored';
    $aaoifi    = $company->aaoifiScreening;
    $aaoifiStatus = $aaoifi ? $aaoifi->final_status : 'No AAOIFI screening';

    $verdict = ($dbStatus === 'non-halal') ? '✅ MATCH' : '⚠️  MISMATCH';
    if ($dbStatus === 'non-halal') $matches++; else $mismatches++;

    echo "{$verdict} | {$ticker}\n";
    echo "  Excel: non-halal — {$excelReason}\n";
    echo "  DB Status: {$dbStatus} | AAOIFI: {$aaoifiStatus}\n";
    echo "  DB Reason: " . substr($dbReason, 0, 200) . "\n";
    echo "\n";
}

echo str_repeat("=", 100) . "\n";
echo "SUMMARY:\n";
echo "  ✅ Matching (both non-halal): {$matches}\n";
echo "  ⚠️  Mismatches (Excel=non-halal, DB differs): {$mismatches}\n";
echo "  ❓ Not in DB: {$notInDb}\n";
