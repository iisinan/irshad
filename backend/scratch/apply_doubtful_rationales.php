<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;
use App\Models\Company;

$updates = [
    'AFROMEDIA' => "Media and advertising operations present concerns regarding the revenue mix, specifically the proportion derived from advertising for impermissible sectors like alcohol and gambling.",
    'DAARCOMM' => "Media and advertising operations present concerns regarding the revenue mix, specifically the proportion derived from advertising for impermissible sectors like alcohol and gambling.",
    'BETAGLAS' => "While the core manufacturing business is permissible, a dominant portion of the customer base consists of breweries and alcohol producers, raising concerns about the revenue source mix.",
    'CILEASING' => "Equipment leasing operations involve conventional lease financing structures that may incorporate impermissible interest-based terms.",
    'HMCALL' => "Operations include significant hospitality and hotel segments, raising concerns about the potential for impermissible revenue sources from alcohol sales and related services.",
    'TRANSCORP' => "Operations include significant hospitality and hotel segments, raising concerns about the potential for impermissible revenue sources from alcohol sales and related services.",
    'NCR' => "While the core technology vending business is permissible, the company explicitly targets the gaming and betting industry as a key vertical, raising concerns about the proportion of revenue derived from this impermissible sector.",
    'NGXGROUP' => "While core exchange operations are fee-based, strategic investments include significant stakes in platforms dedicated primarily to conventional, interest-based bond and money-market trading.",
    'SFSREIT' => "As a Real Estate Investment Trust (REIT), the portfolio strategy explicitly incorporates conventional, interest-bearing mortgage assets and debt instruments alongside physical property, raising concerns about interest-based revenue.",
    'UHOMREIT' => "As a Real Estate Investment Trust (REIT), the portfolio strategy explicitly incorporates conventional, interest-bearing mortgage assets and debt instruments alongside physical property, raising concerns about interest-based revenue.",
    'UPDCREIT' => "As a Real Estate Investment Trust (REIT), the portfolio strategy explicitly incorporates conventional, interest-bearing mortgage assets and debt instruments alongside physical property, raising concerns about interest-based revenue.",
    'TANTALIZER' => "While the core restaurant business is permissible, a subsidiary operates a 'live-game show' platform, raising unresolved concerns about whether the revenue model involves impermissible wagering or betting formats.",
    'NEWGOLD' => "While the underlying asset (physical gold) is permissible, the fund's custodial structure and standard T+ settlement cycle raise concerns regarding Shariah standards that require immediate possession for gold trades (avoiding Riba al-Fadl).",
    'VETGOODS' => "Passively tracks an index where the composition historically includes breweries alongside permissible consumer goods companies, raising concerns about the aggregate business activity mix.",
    'VETINDETF' => "Passively tracks an index containing a diverse basket of equities; however, the exact composition, constituent weights, and inclusion of companies from impermissible sectors require further verification.",
    'MERGROWTH' => "Passively tracks an index containing a diverse basket of equities; however, the exact composition, constituent weights, and inclusion of companies from impermissible sectors require further verification.",
    'MERVALUE' => "Passively tracks an index containing a diverse basket of equities; however, the exact composition, constituent weights, and inclusion of companies from impermissible sectors require further verification.",
];

$updatedCount = 0;

foreach ($updates as $symbol => $rephrased) {
    $company = Company::where('symbol', $symbol)->first();
    if (!$company) {
        echo "Company $symbol not found.\n";
        continue;
    }
    
    $screening = AaoifiScreening::where('company_id', $company->id)->first();
    if ($screening) {
        $reason = is_string($screening->business_reasoning) ? json_decode($screening->business_reasoning, true) : $screening->business_reasoning;
        if (!is_array($reason)) {
            $reason = [];
        }
        $reason = ['summary' => $rephrased];
        
        $screening->business_reasoning = json_encode($reason);
        $screening->save();
        $updatedCount++;
        echo "Updated $symbol\n";
    }
}

echo "Successfully updated $updatedCount doubtful rationales.\n";
