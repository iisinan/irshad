<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tickers = ['JAIZBANK', 'NREIT', 'NAHCO', 'LOTUSHAL15'];

$companies = \DB::table('companies')
    ->join('aaoifi_screenings', 'companies.id', '=', 'aaoifi_screenings.company_id')
    ->whereIn('companies.symbol', $tickers)
    ->select('companies.symbol', 'aaoifi_screenings.financial_data_used', 'aaoifi_screenings.final_status')
    ->get();

$md = "| Ticker | Published Date | Final Verdict | Source PDF |\n";
$md .= "|--------|----------------|---------------|------------|\n";
foreach ($companies as $company) {
    $data = $company->financial_data_used ? json_decode($company->financial_data_used, true) : [];
    
    $url = 'N/A';
    $date = 'N/A';
    if (!empty($data['source_links'])) {
        $link = $data['source_links'][0];
        $url = $link['url'] ?? 'N/A';
        $date = $link['published_date'] ?? 'N/A';
    }
    
    $mdUrl = ($url !== 'N/A') ? "[View PDF]($url)" : "N/A";
    $status = ucfirst($company->final_status ?? 'Unknown');
    
    $md .= "| **{$company->symbol}** | $date | $status | $mdUrl |\n";
}

file_put_contents('/Users/sinan/.gemini/antigravity/brain/0d6348b1-d790-4758-9429-ffd771661774/halal_financial_sources.md', $md);
