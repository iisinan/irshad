<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

// Justifications aligned with the Excel screening rationale
$justifications = [
    'AFROMEDIA' => "AFROMEDIA is classified as doubtful under AAOIFI Shariah standards. The company operates in outdoor advertising and media, which is a permissible core activity. However, concerns exist regarding the composition of its client mix — specifically the proportion of revenue derived from advertising for alcohol brands, conventional financial products, and betting/gambling operators. Until a detailed client revenue breakdown is disclosed and verified, the impermissible income ratio cannot be confirmed to be below the AAOIFI 5% threshold.",

    'BETAGLAS' => "BETAGLAS is classified as doubtful under AAOIFI Shariah standards. The company manufactures glass bottles and containers, which is a permissible industrial activity. However, named major customers explicitly include Nigerian Breweries (Heineken), AB InBev, and Guinness Nigeria — alcohol producers appear to be a dominant, not merely incidental, part of the customer base. Until a customer revenue breakdown confirms the share of revenue attributable to alcohol producers falls below the AAOIFI 5% impermissible income threshold, the stock remains doubtful.",

    'DAARCOMM' => "DAARCOMM is classified as doubtful under AAOIFI Shariah standards. DAAR Communications operates broadcast media (television and radio), which is permissible in principle. However, concerns arise from (a) potential advertising revenue from alcohol brands, betting companies, and conventional financial institutions, and (b) programming content standards. Revenue attribution data is needed to determine whether impermissible advertising income exceeds the AAOIFI 5% threshold.",

    'HMCALL' => "HMCALL (Haldane McCall) is classified as doubtful under AAOIFI Shariah standards. The company operates a mix of real estate and hospitality businesses, predominantly under the Suru Express Hotel brand in Lagos. Hotel and resort operations inherently raise concerns around potential impermissible revenue streams such as alcohol sales from in-house bars and non-halal catering. A detailed revenue segment breakdown is required to confirm compliance with the AAOIFI 5% impermissible income threshold.",

    'NCR' => "NCR Nigeria is classified as doubtful under AAOIFI Shariah standards. The company's core business involves hardware and technology vending — ATMs, POS terminals, self-service kiosks, and software — which is a permissible activity. However, the company explicitly names 'gaming' as a served industry vertical alongside financial services, retail, and hospitality. The revenue share attributable to gaming and betting-sector clients is unconfirmed. Segment data is needed to verify that impermissible revenue falls below the AAOIFI 5% threshold.",

    'NGXGROUP' => "NGXGROUP is classified as doubtful under AAOIFI Shariah standards. NGX Group's core operations — exchange services, regulation, real estate, and market data — are fee-based and are generally permissible. However, its Strategic Investment segment holds equity stakes in FMDQ Securities Exchange, a market infrastructure platform dedicated almost entirely to conventional bond, money-market, and FX derivatives trading — instruments that are predominantly interest-bearing. The revenue contribution and structural exposure from FMDQ requires further analysis before a clean halal verdict can be given.",

    'SFSREIT' => "SFSREIT (SFS Real Estate Investment Trust) is classified as doubtful under AAOIFI Shariah standards. Its core business of acquiring, leasing, and managing commercial and residential real estate is genuinely permissible. However, the fund's governing allocation rules earmark up to 25% of assets for real estate-related debt instruments such as mortgages and real estate-backed securities. Additionally, its own risk disclosures confirm exposure to interest rate fluctuations due to interest-bearing financial instruments held within the portfolio. This structural allocation to riba-based instruments is a disclosed financial-ratio concern under AAOIFI standards.",

    'TANTALIZER' => "TANTALIZER is classified as doubtful under AAOIFI Shariah standards. Its core quick-service restaurant business is permissible, provided no alcohol is sold at any outlet. However, its wholly owned subsidiary Tantainment Limited operates a live-game show platform called 'Chances by Tantainment,' which launched in Q2 2026. The nature of this platform — specifically whether it involves real-money wagering by viewers or is a production-funded entertainment format — has not been conclusively disclosed in public filings. The emphasis on regulatory and compliance frameworks in disclosures, combined with the platform name and framing, creates material uncertainty requiring further verification.",

    'TRANSCORP' => "TRANSCORP is classified as doubtful under AAOIFI Shariah standards. The conglomerate operates across power generation, oil and gas, and hospitality (Transcorp Hilton Abuja). The power and oil/gas segments are permissible. The concern lies in the hospitality segment: Transcorp Hilton Abuja operates bars, a nightclub, and a casino (with slot machines and table games). A segment-level revenue breakdown is required to determine whether income from alcohol sales and gambling activities at the hotel exceeds the AAOIFI 5% impermissible income threshold.",

    'UHOMREIT' => "UHOMREIT (Union Homes Real Estate Investment Trust) is classified as doubtful under AAOIFI Shariah standards. The fund's core activity of acquiring and managing real estate is permissible. However, the fund is managed by Union Homes Savings & Loans Plc, a subsidiary of Union Bank of Nigeria (a conventional bank), and its investment strategy explicitly includes mortgage assets alongside direct property holdings. The fund's financial statements confirm that loans and receivables are measured at amortised cost using the effective interest method — confirming that interest-bearing mortgage accounting is on the fund's own books. This constitutes a direct financial-ratio concern under AAOIFI standards.",

    'UPDCREIT' => "UPDCREIT (UPDC Real Estate Investment Trust) is classified as doubtful under AAOIFI Shariah standards. While real estate investment trusts whose income derives exclusively from property rental and capital appreciation are generally permissible, UPDCREIT's investment policy and portfolio disclosures raise concerns regarding the nature of its underlying investment instruments and financing sources. Specifically, the fund's exposure to interest-bearing debt instruments, mortgage-backed assets, and the conventional financing structures used to leverage the portfolio have not been sufficiently disaggregated in public disclosures to confirm compliance with AAOIFI financial screening thresholds.",

    'NEWGOLD' => "NEWGOLD ETF is classified as doubtful under AAOIFI Shariah standards. Each unit of the NewGold ETF represents a claim on physical gold bullion held in a vault — gold itself is a permissible asset. However, AAOIFI Shariah Standard No. 57 (Gold and its Trading Controls) requires that gold trades must achieve immediate or constructive possession and same-session (spot) settlement to avoid riba al-fadl and gharar. Concerns remain around NewGold's custodial structure (allocated vs. unallocated bullion), the T+2 or T+3 settlement cycle used on the NGX exchange, and whether unit-holders have enforceable, immediate constructive possession of the underlying physical gold. These structural questions require resolution before a clean halal verdict can be issued.",
];

$updated = 0;

foreach ($justifications as $ticker => $reason) {
    $company = Company::where('symbol', $ticker)->first();
    if (!$company) {
        echo "❌ {$ticker} — not found.\n";
        continue;
    }

    $old = $company->activity_reason;
    $company->activity_reason = $reason;
    $company->save();

    $status = empty($old) ? '[was empty]' : '[updated]';
    echo "✅ {$ticker} — {$status}\n";
    $updated++;
}

echo "\nDone. {$updated} justifications written.\n";
