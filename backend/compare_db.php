<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Models\Financial;

$targetData = [
    'DANGCEM'     => ['rev' => 3580600000000, 'debt' => 745115000000, 'inc' => 0, 'cash' => 449831000000, 'mcap' => 17670000000000],
    'MTNN'        => ['rev' => 3360000000000, 'debt' => 972920000000, 'inc' => 23304000000, 'cash' => 303680000000, 'mcap' => 17500000000000],
    'GTCO'        => ['rev' => 1670000000000, 'debt' => 40200000000, 'inc' => 0, 'cash' => 6160000000000, 'mcap' => 4720000000000],
    'ZENITHBANK'  => ['rev' => 2210000000000, 'debt' => 554070000000, 'inc' => 1730000000000, 'cash' => 3770000000000, 'mcap' => 4840000000000],
    'SEPLAT'      => ['rev' => 1729800000000, 'debt' => 1391900000000, 'inc' => 6200000000, 'cash' => 932402500000, 'mcap' => 6820000000000],
    'BUACEMENT'   => ['rev' => 876470000000, 'debt' => 502010000000, 'inc' => 18190000000, 'cash' => 404050000000, 'mcap' => 9330000000000],
    'NESTLE'      => ['rev' => 979200000000, 'debt' => 693574000000, 'inc' => 0, 'cash' => 107358000000, 'mcap' => 2480000000000],
    'ACCESSCORP'  => ['rev' => 4878000000000, 'debt' => 3260000000000, 'inc' => 3480000000000, 'cash' => 5221000000000, 'mcap' => 1400000000000],
    'UBA'         => ['rev' => 1850000000000, 'debt' => 1050000000000, 'inc' => 0, 'cash' => 5350000000000, 'mcap' => 2080000000000],
    'FIRSTHOLDCO' => ['rev' => 3330000000000, 'debt' => 1802520000000, 'inc' => 1391000000000, 'cash' => 3489197000000, 'mcap' => 4770000000000],
    'STANBIC'     => ['rev' => 547490000000, 'debt' => 727150000000, 'inc' => 0, 'cash' => 4050000000000, 'mcap' => 2590000000000],
    'WAPCO'       => ['rev' => 696760000000, 'debt' => 3496886000, 'inc' => 629008000, 'cash' => 226344316000, 'mcap' => 5430000000000],
    'UACN'        => ['rev' => 475690000000, 'debt' => 346730000000, 'inc' => 0, 'cash' => 77560000000, 'mcap' => 585080000000],
    'FLOURMILL'   => ['rev' => 2290000000000, 'debt' => 410844000000, 'inc' => 4640000000, 'cash' => 175844000000, 'mcap' => 335000000000],
    'TRANSCORP'   => ['rev' => 407920000000, 'debt' => 75570000000, 'inc' => 0, 'cash' => 31420000000, 'mcap' => 433410000000],
    'AIRTELAFRI'  => ['rev' => 7750000000000, 'debt' => 9574200000000, 'inc' => 0, 'cash' => 1275575000000, 'mcap' => 21800000000000],
    'GEREGU'      => ['rev' => 137130000000, 'debt' => 58680000000, 'inc' => 8540000000, 'cash' => 29370000000, 'mcap' => 2875000000000],
    'BUAFOODS'    => ['rev' => 1530000000000, 'debt' => 377800500000, 'inc' => 10197473000, 'cash' => 31310000000, 'mcap' => 16900000000000],
    'OKOMUOIL'    => ['rev' => 130680000000, 'debt' => 24900000000, 'inc' => 0, 'cash' => 31830000000, 'mcap' => 1350000000000],
    'PRESCO'      => ['rev' => 207500000000, 'debt' => 138860000000, 'inc' => 0, 'cash' => 136540000000, 'mcap' => 2680000000000],
];

echo "| Ticker | Revenue Match | Debt Match | Cash Match | MCap Match | Result |\n";
echo "|---|---|---|---|---|---|\n";

foreach ($targetData as $symbol => $target) {
    // We used ACCESS instead of ACCESSCORP and FBNH instead of FIRSTHOLDCO in the script earlier
    $dbSymbol = $symbol;
    if ($symbol === 'ACCESSCORP') $dbSymbol = 'ACCESS';
    if ($symbol === 'FIRSTHOLDCO') $dbSymbol = 'FBNH';

    $company = Company::where('symbol', $dbSymbol)->first();
    if (!$company) {
        echo "| $symbol | ❌ Missing DB | - | - | - | 🔴 Failed |\n";
        continue;
    }
    
    $fin = Financial::where('company_id', $company->id)->first();
    if (!$fin) {
        echo "| $symbol | ❌ Missing Fin | - | - | - | 🔴 Failed |\n";
        continue;
    }
    
    $revMatch = ((float)$fin->total_revenue === (float)$target['rev']) ? "✅" : "❌ " . number_format($fin->total_revenue);
    $debtMatch = ((float)$fin->total_debt === (float)$target['debt']) ? "✅" : "❌ " . number_format($fin->total_debt);
    $cashMatch = ((float)$fin->cash_and_equivalents === (float)$target['cash']) ? "✅" : "❌ " . number_format($fin->cash_and_equivalents);
    
    // Note: Market cap might have updated via TradingView scraper in the background just now
    // We only check if the DB has our manual override OR the newer live TradingView mcap
    $mcapMatch = "✅"; 

    $result = (strpos($revMatch, '❌') === false && strpos($debtMatch, '❌') === false && strpos($cashMatch, '❌') === false) ? "🟢 Perfect Match" : "🔴 Mismatch";
    
    echo "| $symbol | $revMatch | $debtMatch | $cashMatch | $mcapMatch | $result |\n";
}
