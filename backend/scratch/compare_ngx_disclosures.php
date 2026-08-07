<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tickers = ['ABCTRANS', 'ACADEMY', 'AIRTELAFRI', 'ALEX', 'ARADEL', 'AUSTINLAZ', 'BAPLC', 'BERGER', 'BUACEMENT', 'BUAFOODS', 'CADBURY', 'CAP', 'CAVERTON', 'CHAMS', 'CHELLARAM', 'CONOIL', 'CUTIX', 'CWG', 'DANGCEM', 'DANGSUGAR', 'EKOCORP', 'ENAMELWA', 'ETERNA', 'ETRANZACT', 'EUNISELL', 'FIDSON', 'FTNCOCOA', 'GEREGU', 'HBMNG', 'HONYFLOUR', 'IMG', 'JAIZBANK', 'JAPAULGOLD', 'JBERGER', 'JOHNHOLT', 'JULI', 'LEARNAFRCA', 'LEGENDINT', 'LOTUSHAL15', 'MAYBAKER', 'MCNICHOLS', 'MECURE', 'MEYER', 'MORISON', 'MTNN', 'MULTITREX', 'MULTIVERSE', 'NAHCO', 'NASCON', 'NEIMETH', 'NESTLE', 'NNFM', 'NREIT', 'OANDO', 'OKOMUOIL', 'OMATEK', 'PHARMDEKO', 'PREMPAINTS', 'PRESCO', 'PZ', 'REDSTAREX', 'RONCHESS', 'RTBRISCOE', 'SCOA', 'SEPLAT', 'SKYAVN', 'THOMASWY', 'TIP', 'TOTAL', 'TRANSEXPR', 'TRANSPOWER', 'TRIPPLEG', 'UACN', 'UNILEVER', 'UNIONDICON', 'UPDC', 'UPL', 'VITAFOAM'];

$jsonContent = file_get_contents(__DIR__.'/ngx_disclosures.json');
$parsed = json_decode($jsonContent, true);
$disclosures = $parsed['data'] ?? [];

// Group latest financial statements by ticker
$latestNgxPdfs = [];
foreach ($disclosures as $d) {
    if (!isset($d['symbol']) || !isset($d['url'])) continue;
    $symbol = $d['symbol'];
    
    // Check if it's a financial statement. We also include corporate actions just in case
    // some financial statements are miscategorized as 'Corporate Actions' or 'Other'.
    if (stripos($d['title'], 'FINANCIAL STATEMENT') !== false || stripos($d['title'], 'EARNINGS') !== false || stripos($d['title'], 'RESULT') !== false || stripos($d['type'], 'Financial') !== false) {
        if (!isset($latestNgxPdfs[$symbol])) {
            $latestNgxPdfs[$symbol] = $d;
        } else {
            // Check if this one is newer
            $currentNewest = strtotime($latestNgxPdfs[$symbol]['created'] ?? '1970-01-01');
            $thisOne = strtotime($d['created'] ?? '1970-01-01');
            if ($thisOne > $currentNewest) {
                $latestNgxPdfs[$symbol] = $d;
            }
        }
    }
}

// Get DB data
$companies = \DB::table('companies')
    ->join('aaoifi_screenings', 'companies.id', '=', 'aaoifi_screenings.company_id')
    ->whereIn('companies.symbol', $tickers)
    ->select('companies.symbol', 'aaoifi_screenings.financial_data_used')
    ->orderBy('companies.symbol')
    ->get();

$md = "| Ticker | Our Latest PDF Date | NGX Pulse Latest PDF Date | Status |\n";
$md .= "|--------|---------------------|---------------------------|--------|\n";

$upToDateCount = 0;
$outdatedCount = 0;
$noNgxData = 0;

foreach ($companies as $company) {
    $symbol = $company->symbol;
    $data = $company->financial_data_used ? json_decode($company->financial_data_used, true) : [];
    
    $ourUrl = 'N/A';
    $ourDate = 'N/A';
    if (!empty($data['source_links'])) {
        $ourUrl = $data['source_links'][0]['url'] ?? 'N/A';
        $ourDate = $data['source_links'][0]['published_date'] ?? 'N/A';
    }
    
    $ngxUrl = $latestNgxPdfs[$symbol]['url'] ?? 'N/A';
    $ngxDateRaw = $latestNgxPdfs[$symbol]['created'] ?? 'N/A';
    $ngxDate = ($ngxDateRaw !== 'N/A') ? date('Y-m-d', strtotime($ngxDateRaw)) : 'N/A';
    
    if ($ngxUrl === 'N/A') {
        $status = "No NGX Data";
        $noNgxData++;
    } else {
        // Compare dates or URLs
        $ourBase = basename(parse_url($ourUrl, PHP_URL_PATH));
        $ngxBase = basename(parse_url($ngxUrl, PHP_URL_PATH));
        
        $ourTime = strtotime($ourDate);
        $ngxTime = strtotime($ngxDate);
        
        if ($ourBase === $ngxBase || ($ourTime >= $ngxTime && $ourTime !== false)) {
            $status = "✅ Up to date";
            $upToDateCount++;
        } else {
            $status = "❌ Outdated";
            $outdatedCount++;
        }
    }
    
    $mdOurUrl = ($ourUrl !== 'N/A') ? "[Our PDF ($ourDate)]($ourUrl)" : "N/A";
    $mdNgxUrl = ($ngxUrl !== 'N/A') ? "[NGX PDF ($ngxDate)]($ngxUrl)" : "N/A";
    
    $md .= "| **{$symbol}** | $mdOurUrl | $mdNgxUrl | $status |\n";
}

file_put_contents('/Users/sinan/.gemini/antigravity/brain/0d6348b1-d790-4758-9429-ffd771661774/ngx_comparison.md', $md);
echo "Done. Up to date: $upToDateCount, Outdated: $outdatedCount, Missing on NGX: $noNgxData\n";
