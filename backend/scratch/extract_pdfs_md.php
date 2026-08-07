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

$md = "| Ticker | Published Date | Quarter | Source PDF |\n";
$md .= "|--------|----------------|---------|------------|\n";
foreach ($companies as $company) {
    if (!$company->financial_data_used) continue;
    $data = json_decode($company->financial_data_used, true);
    if (empty($data['source_links'])) continue;

    $link = $data['source_links'][0];
    $url = $link['url'] ?? 'N/A';
    $quarter = $link['report_quarter'] ?? 'N/A';
    $date = $link['published_date'] ?? 'N/A';
    
    // Clean up url for markdown
    $mdUrl = ($url !== 'N/A') ? "[View PDF]($url)" : "N/A";
    
    $md .= "| **{$company->symbol}** | $date | $quarter | $mdUrl |\n";
}

file_put_contents('/Users/sinan/.gemini/antigravity/brain/0d6348b1-d790-4758-9429-ffd771661774/financial_sources.md', $md);
