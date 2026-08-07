<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tickers = ['ABCTRANS', 'ACADEMY', 'AIRTELAFRI', 'ALEX', 'ARADEL', 'AUSTINLAZ', 'BAPLC', 'BERGER', 'BUACEMENT', 'BUAFOODS', 'CADBURY', 'CAP', 'CAVERTON', 'CHAMS', 'CHELLARAM', 'CONOIL', 'CUTIX', 'CWG', 'DANGCEM', 'DANGSUGAR', 'EKOCORP', 'ENAMELWA', 'ETERNA', 'ETRANZACT', 'EUNISELL', 'FIDSON', 'FTNCOCOA', 'GEREGU', 'HBMNG', 'HONYFLOUR', 'IMG', 'JAIZBANK', 'JAPAULGOLD', 'JBERGER', 'JOHNHOLT', 'JULI', 'LEARNAFRCA', 'LEGENDINT', 'LOTUSHAL15', 'MAYBAKER', 'MCNICHOLS', 'MECURE', 'MEYER', 'MORISON', 'MTNN', 'MULTITREX', 'MULTIVERSE', 'NAHCO', 'NASCON', 'NEIMETH', 'NESTLE', 'NNFM', 'NREIT', 'OANDO', 'OKOMUOIL', 'OMATEK', 'PHARMDEKO', 'PREMPAINTS', 'PRESCO', 'PZ', 'REDSTAREX', 'RONCHESS', 'RTBRISCOE', 'SCOA', 'SEPLAT', 'SKYAVN', 'THOMASWY', 'TIP', 'TOTAL', 'TRANSEXPR', 'TRANSPOWER', 'TRIPPLEG', 'UACN', 'UNILEVER', 'UNIONDICON', 'UPDC', 'UPL', 'VITAFOAM'];

$companies = \DB::table('companies')
    ->join('aaoifi_screenings', 'companies.id', '=', 'aaoifi_screenings.company_id')
    ->whereIn('companies.symbol', $tickers)
    ->select('companies.symbol', 'aaoifi_screenings.financial_data_used')
    ->get();

foreach ($companies as $company) {
    if (!$company->financial_data_used) continue;
    $data = json_decode($company->financial_data_used, true);
    if (empty($data['source_links'])) continue;

    $link = $data['source_links'][0];
    echo "- **" . $company->symbol . "**:\n";
    echo "  - PDF Source: " . ($link['url'] ?? 'N/A') . "\n";
    echo "  - Quarter: " . ($link['report_quarter'] ?? 'N/A') . "\n";
    echo "  - Published Date: " . ($link['published_date'] ?? 'N/A') . "\n";
}
