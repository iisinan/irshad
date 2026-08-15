<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\StockStatus;
use App\Models\AaoifiScreening;

$updates = [
    'AFROMEDIA' => "While outdoor advertising is a permissible business, there are concerns regarding the company's client mix, particularly the proportion of advertising revenue derived from alcohol and betting promotions.",
    'BETAGLAS' => "The company manufactures glass packaging, which is inherently permissible and caters to diverse industries including pharmaceuticals and cosmetics. However, breweries and spirits producers—such as Nigerian Breweries, AB InBev, and Guinness Nigeria—constitute a dominant segment of its customer base, raising significant concerns regarding its primary revenue sources.",
    'CILEASING' => "Although equipment leasing (structured similarly to an Ijara contract) is permissible in principle, there are concerns that the company's leasing framework relies on conventional, interest-based lease financing structures.",
    'DAARCOMM' => "As a broadcast media operator, there are concerns regarding the company's programming content standards and its reliance on advertising revenue from non-compliant sectors such as alcohol and betting.",
    'HMCALL' => "The company operates a mix of real estate and hospitality ventures, including budget hotel chains like the Suru Express Hotel brand. This raises compliance concerns regarding the specific sources of revenue generated within its hospitality and resort operations.",
    'NCR' => "The company's core business involves hardware and technology vending (ATMs, POS terminals, and software). While it does not operate gaming directly, its corporate literature lists 'gaming' as a primary industry vertical. This creates a mixed-client vendor profile with unconfirmed revenue exposure to the gaming and betting sectors.",
    'NGXGROUP' => "The core exchange operations (NGX Exchange, NGX RegCo) generate permissible fee-based income from listings and market data. However, the Strategic Investment segment holds an equity stake in FMDQ Securities Exchange, a market heavily dedicated to conventional bonds, money markets, and FX trading, creating concerns regarding its consolidated revenue mix.",
    'SFSREIT' => "While acquiring and managing commercial real estate is permissible, the fund's governing rules allocate up to 25% of its portfolio to real estate-related financial instruments, including mortgages and debt securities. Its own disclosures confirm exposure to interest rate fluctuations, indicating structurally earmarked investments in conventional interest-bearing instruments.",
    'TANTALIZER' => "The core quick-service restaurant business operates compliantly. However, its wholly owned subsidiary, Tantainment Limited, operates a live-game platform called 'Chances by Tantainment'. Due to the lack of clarity on whether this involves real-money wagering by viewers or prize-funded entertainment, it raises regulatory and compliance concerns regarding the revenue mix.",
    'TRANSCORP' => "As a diversified conglomerate operating across power, oil and gas, and hospitality (including Transcorp Hilton), there are substantial compliance concerns regarding the mix of its business segments and the permissibility of its consolidated revenue sources.",
    'UHOMREIT' => "While investing in real estate is permissible, the fund's financial statements explicitly state a strategy of investing in equity and debt securities. It directly holds mortgage assets and measures loans and receivables at amortised cost using the effective interest method, creating a disclosed financial-ratio concern.",
    'UPDCREIT' => "As a real estate investment trust, there are underlying compliance concerns regarding the specific sources of its investments and the nature of the resulting financial returns.",
    'NEWGOLD' => "While physical gold is a permissible asset, AAOIFI Shariah Standard No. 57 strictly requires immediate possession and same-session settlement for gold trades to avoid riba al-fadl. NewGold ETF's custodial structure and T+ settlement cycle raise compliance concerns regarding these settlement requirements.",
    'VETGOODS' => "The ETF tracks the NGX Consumer Goods Index. Because this index historically includes conventional brewers (such as Nigerian Breweries and Guinness) alongside permissible food companies, the constituent weights present a fundamental compliance concern.",
    'VETINDETF' => "The ETF tracks the NGX Industrial Index. While the dominant cement and building-material manufacturers generally pass standalone business screens, the fund remains doubtful pending a precise compliance verdict on every underlying constituent and their respective portfolio weights.",
    'MERGROWTH' => "The ETF tracks the Meristem Growth Index, which contains companies spanning multiple sectors, including conventional financial services. It remains doubtful pending a precise compliance verdict on every underlying constituent and their respective portfolio weights.",
    'MERVALUE' => "The ETF tracks the Meristem Value Index. It remains doubtful pending a precise compliance verdict on every underlying constituent and their respective portfolio weights."
];

$count = 0;
foreach ($updates as $symbol => $reason) {
    $company = Company::where('symbol', $symbol)->first();
    if ($company) {
        // Update stock_statuses
        $status = StockStatus::where('company_id', $company->id)->first();
        if ($status) {
            $status->reason = $reason;
            $status->save();
        } else {
            StockStatus::create([
                'company_id' => $company->id,
                'status' => 'doubtful',
                'reason' => $reason,
                'verified_by_scholar' => false,
                'last_updated' => now()
            ]);
        }
        
        // Update aaoifi_screenings
        $screening = AaoifiScreening::where('company_id', $company->id)->latest()->first();
        if ($screening) {
            $screening->business_reasoning = $reason;
            $screening->save();
        }
        
        echo "Updated $symbol\n";
        $count++;
    } else {
        echo "WARNING: $symbol not found in database.\n";
    }
}

echo "Successfully applied AI-rephrased justifications for $count doubtful stocks.\n";
