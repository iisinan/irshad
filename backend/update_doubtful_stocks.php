<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$updates = [
    'AFROMEDIA' => "Afromedia operates in outdoor advertising and media. The company is marked as doubtful pending verification of its client mix, specifically the revenue share derived from advertising impermissible products such as alcohol or betting.",
    'BETAGLAS' => "Beta Glass manufactures glass bottles and containers. While the core product is permissible, major clients include prominent breweries and spirits producers. A customer-revenue breakdown is required to confirm if revenue from impermissible alcohol-industry clients exceeds acceptable thresholds.",
    'CILEASING' => "C&I Leasing engages in equipment leasing. While ijara-style leasing is permissible, the company is marked as doubtful pending verification that its lease financing structures do not involve conventional interest-bearing (riba) mechanics.",
    'DAARCOMM' => "DAAR Communications operates in broadcast media. The company is doubtful pending a review of its programming and advertising content mix to ensure compliance regarding impermissible entertainment standards and advertisements (e.g., alcohol, betting).",
    'HMCALL' => "Haldane McCall operates a mix of real estate and hospitality businesses. Its hotel and resort operations may involve impermissible revenue streams, such as alcohol sales from bars, which requires verification.",
    'NCR' => "NCR's core business involves hardware and technology vending (ATMs, POS, software). However, the company serves the gaming industry as a named vertical. Segment data is needed to confirm the revenue share attributable to gaming and betting-sector clients.",
    'NGXGROUP' => "NGX Group's core operations (exchange, regulation) are fee-based and permissible. However, its Strategic Investment segment holds stakes in FMDQ Securities Exchange, a market dedicated to conventional bond and money-market trading. The exact stake size and FMDQ's revenue mix must be confirmed.",
    'SCOA' => "SCOA Nigeria is a diversified trading conglomerate dealing in vehicles and equipment. It is marked as doubtful pending a detailed breakdown of its segment revenue mix to rule out impermissible activities.",
    'SFSREIT' => "SFS REIT's core real estate business is permissible. However, its allocation rules and risk disclosures indicate structural exposure to interest-bearing mortgage and debt instruments (up to 25% of the portfolio). This presents a disclosed financial-ratio concern.",
    'TANTALIZER' => "Tantalizers' core quick-service restaurant business is permissible. However, its subsidiary Tantainment Limited operates a 'live-game show' platform. Direct verification is needed to determine whether this involves real-money wagering or is simply a production-funded entertainment format.",
    'TRANSCORP' => "Transcorp is a diversified conglomerate spanning power, oil/gas, and hospitality (Transcorp Hilton). It is marked as doubtful pending a segment breakdown, specifically regarding hotel bar revenue and alcohol sales.",
    'UHOMREIT' => "Union Homes REIT is managed by a subsidiary of Union Bank. The fund's portfolio includes direct investments in mortgage assets alongside property, with explicit interest-bearing loan accounting on its books, presenting a financial-ratio concern.",
    'NEWGOLD' => "NewGold ETF represents a claim on physical gold bullion, which is a permissible asset. However, AAOIFI standards require immediate possession and same-session settlement for gold trades. The fund's custodial and settlement structure requires confirmation to ensure compliance.",
    'VETGOODS' => "Vetiva Consumer Goods ETF tracks the NGX Consumer Goods Index. This sector historically includes breweries alongside permissible food companies. Constituent weights must be verified to ensure the fund meets compliance thresholds.",
    'VETINDETF' => "Vetiva Industrial ETF tracks the NGX Industrial Index. While dominated by permissible cement and building-materials manufacturers, the exact constituent list and weights require verification to warrant a full pass.",
    'MERGROWTH' => "Meristem Growth ETF tracks a growth-oriented basket of equities. Growth indices historically span multiple sectors, including conventional financial services. Sector exposure and constituent weights require verification.",
    'MERVALUE' => "Meristem Value ETF tracks a value-oriented basket of equities. The constituent sector mix and exposure to non-permissible industries require verification before a compliance ruling can be made."
];

$count = 0;
foreach ($updates as $ticker => $reason) {
    // Also updating StockStatus if it exists, as well as the Company model.
    $company = \App\Models\Company::where('symbol', $ticker)->first();
    if ($company) {
        $company->current_status = 'doubtful';
        $company->activity_reason = $reason;
        
        // I will just use try-catch in case it doesn't.
        try {
        } catch (\Exception $e) {}
        
        $company->save();
        
        // Also update StockStatus table which is commonly used in this project
        $stockStatus = \App\Models\StockStatus::where('company_id', $company->id)->first();
        if (!$stockStatus) {
            $stockStatus = new \App\Models\StockStatus();
            $stockStatus->company_id = $company->id;
        }
        $stockStatus->status = 'doubtful';
        $stockStatus->reason = $reason;
        $stockStatus->save();
        
        echo "Updated $ticker\n";
        $count++;
    } else {
        echo "Company $ticker not found in DB.\n";
    }
}
echo "Total updated: $count\n";
