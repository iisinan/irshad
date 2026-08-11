<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\StockStatus;

$updates = [
    'UHOMREIT' => "Core business (acquiring, developing, managing, and selling real estate) is genuinely permissible. However, it is managed by Union Homes Savings & Loans Plc, a subsidiary of Union Bank of Nigeria Plc. The Fund Managers spread the portfolio mix across commercial and residential property investments and mortgage assets, meaning the fund directly holds mortgage assets, not just property. Its financial statements state the investment strategy is to invest in equity and debt securities, with loans and receivables measured at amortized cost using the effective interest method. This indicates explicit interest-bearing loan accounting on the fund's books. ||| Clear disclosed financial-ratio concern.",
    
    'DAARCOMM' => "Core business is broadcast media. ||| Concerns with revenue sources from programming content mix (advertising for alcohol and betting, and entertainment content standards).",
    
    'UPDCREIT' => "Core business is a real estate investment trust. ||| Concerns regarding investment sources and results.",
    
    'NCR' => "Core business is hardware and technology vending (ATMs, POS terminals, self-service kiosks, software). It is not a gaming operator itself. However, company literature explicitly names 'gaming' as one of its served industry verticals alongside financial services, retail, hospitality, healthcare, and travel. This is a vendor-to-mixed-clients profile (comparable to leasing to varied tenants) rather than a direct activity exclusion, but the revenue share attributable to gaming and betting sector clients remains unconfirmed. ||| Concerns with revenue source mix.",
    
    'TANTALIZER' => "Core quick-service restaurant business remains permissible (no alcohol sales at any outlet). However, wholly owned subsidiary Tantainment Limited runs a 'live-game show' platform called 'Chances by Tantainment' (launched Q2 2026, ~N30bn valuation, with a 10% stake sold to RGM Materials Solutions for N2bn). Public disclosures do not clarify whether 'Chances' involves real-money wagering by viewers or is a production-funded prize format. The name, emphasis on regulatory and compliance frameworks, and 'tech-driven platform' framing create ambiguity. ||| Concerns with revenue source mix.",
    
    'BETAGLAS' => "Manufactures generic glass bottles and containers. The product itself (glass packaging) is permissible, and clients span soft drinks, pharma, food, and cosmetics. However, named major customers explicitly include Nigerian Breweries (Heineken), AB InBev, and Guinness Nigeria. Breweries and spirits producers appear to be a dominant, not incidental, part of the customer base. ||| Concerns with revenue source mix.",
    
    'TRANSCORP' => "Diversified conglomerate spanning power, oil & gas, and hospitality (Transcorp Hilton). ||| Concerns with segment and revenue source mix.",
    
    'SFSREIT' => "Core business (acquiring, leasing, and managing commercial and residential real estate) is genuinely permissible as Nigeria's first listed REIT. However, its governing allocation rules typically invest 75% in real estate and 25% in real estate-related investments such as mortgages, real estate-backed securities, and real estate-related equities, plus a 10% cash buffer. Its risk disclosures confirm exposure to unfavorable interest rate fluctuations due to the sensitivity of its financial instruments. Up to a quarter of the portfolio is structurally earmarked for interest-bearing mortgage and debt instruments. ||| Disclosed financial-ratio concern.",
    
    'NGXGROUP' => "Core operated business (NGX Exchange, NGX RegCo, NGX RelCo) is fee-based (listing and trading fees, market data, regulation, real estate) and is permissible, comparable to how most global exchange operators are treated. The complication sits in the Strategic Investment segment: NGX Group holds equity stakes in CSCS and NASD (which are permissible and fee-based), but also in FMDQ Securities Exchange, a market dedicated almost entirely to conventional bond, money-market, and FX trading. ||| Concerns with revenue source mix.",
    
    'HMCALL' => "Real estate and hospitality mix (hotel and resort operations). Owns and operates budget hotels, predominantly under the Suru Express Hotel brand in Lagos. ||| Concerns with revenue source mix.",
    
    'AFROMEDIA' => "Core business is outdoor advertising and media. ||| Concerns with client mix (alcohol and betting ad revenue share).",
    
    'NEWGOLD' => "NewGold ETF units represent a claim on physical gold bullion held in a vault, and gold itself is a permissible asset. However, AAOIFI Shariah Standard No. 57 requires immediate and constructive possession and same-session settlement for gold trades to avoid Riba al-Fadl and Gharar. ||| Concerns regarding NewGold's custodial and settlement structure (allocated vs. unallocated bullion, and T+ settlement cycles)."
];

$count = 0;
foreach ($updates as $sym => $new_reason) {
    $c = Company::where('symbol', $sym)->first();
    if ($c) {
        $status = StockStatus::where('company_id', $c->id)->first();
        if ($status) {
            $status->reason = $new_reason;
            $status->save();
            $count++;
            echo "Updated {$sym}\n";
        }
    }
}
echo "Total updated: {$count}\n";
