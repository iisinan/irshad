<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rephrased = [
    'AFROMEDIA' => "Core operations involve outdoor advertising and media. However, there are significant Shariah compliance concerns regarding the revenue derived from clients in restricted sectors, specifically alcohol and betting advertising.",
    'BETAGLAS' => "While manufacturing generic glass containers is a permissible core activity, there are substantial concerns regarding the company's revenue mix. A dominant portion of its customer base consists of major breweries and spirits producers, raising significant Shariah compliance issues.",
    'CILEASING' => "Although equipment leasing is permissible in principle, there are significant concerns regarding the company's reliance on conventional interest-based lease financing structures, which conflict with Shariah guidelines.",
    'DAARCOMM' => "The company operates in broadcast media. There are considerable Shariah concerns regarding its revenue sources, particularly relating to programming content and advertising revenues derived from the alcohol and betting sectors.",
    'HMCALL' => "The company is involved in real estate and hospitality, including hotel and resort operations. There are underlying Shariah concerns regarding the specific revenue mix generated from operating these hotels.",
    'NCR' => "While the core business of hardware and technology vending is permissible, the company explicitly serves the gaming industry as a key vertical. The unconfirmed proportion of revenue derived from gaming and betting sector clients presents a substantial Shariah compliance concern.",
    'NGXGROUP' => "The core exchange operations generate permissible fee-based income. However, the group holds strategic investments in conventional debt and money-market exchanges, raising significant Shariah concerns regarding the overall revenue mix and investment exposure.",
    'SFSREIT' => "While the core real estate management business is permissible, the trust allocates a significant portion of its portfolio to conventional interest-bearing mortgages and debt instruments. This structural reliance on interest-based assets creates a critical financial screening concern under Shariah principles.",
    'TANTALIZER' => "The core restaurant operations are generally permissible. However, the company operates a live game show subsidiary platform with ambiguous regulatory frameworks, raising serious concerns that its revenue mix may involve impermissible wagering or betting activities.",
    'TRANSCORP' => "As a diversified conglomerate operating across power, energy, and hospitality, there are significant Shariah compliance concerns regarding the composition of its business segments and overall revenue sources.",
    'UHOMREIT' => "Although real estate acquisition and management is permissible, the fund directly holds and manages conventional mortgage assets and debt securities. This explicit use of interest-bearing loans and effective interest accounting presents a direct violation of Shariah financial screening thresholds.",
    'UPDCREIT' => "As a real estate investment trust, there are notable Shariah compliance concerns regarding its underlying investment sources and the structure of its financial returns.",
    'NEWGOLD' => "While physical gold is a permissible asset, there are significant Shariah concerns regarding the fund's custodial and settlement structure. The transaction cycles may conflict with strict Islamic finance requirements for immediate possession and settlement in precious metal trading.",
    'VETGOODS' => "This ETF tracks the consumer goods sector, which historically includes major breweries and tobacco companies. The significant weighting of these impermissible constituents within the index raises critical Shariah compliance concerns regarding the overall business mix.",
    'VETINDETF' => "This ETF tracks industrial goods companies whose standalone operations are generally permissible. However, there are pending Shariah concerns regarding the exact compliance verdicts and weightings of the individual underlying constituents.",
    'MERGROWTH' => "This ETF tracks a growth-oriented index that historically includes conventional financial services. There are significant concerns regarding the compliance verdicts and exact weightings of the underlying constituent companies.",
    'MERVALUE' => "This ETF tracks a value-oriented equities index. There are outstanding Shariah compliance concerns regarding the specific verdicts and weightings of the individual constituent companies within the fund."
];

foreach ($rephrased as $symbol => $rationale) {
    $company = \App\Models\Company::where('symbol', $symbol)->first();
    if ($company) {
        $screening = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();
        if ($screening) {
            $screening->business_reasoning = [$rationale];
            $screening->save();
            
            $status = $company->status;
            if ($status) {
                $status->reason = $rationale;
                $status->save();
            }
            echo "Updated rationale for $symbol\n";
        }
    }
}
