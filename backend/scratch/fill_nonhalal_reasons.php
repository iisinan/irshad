<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$reasons = [

    // ── BANKS ──────────────────────────────────────────────────────────────────

    'ACCESSCORP' => "Access Holdings Plc (formerly Access Bank Plc) is classified as non-halal under AAOIFI Shariah standards. The group operates as a conventional commercial bank whose primary revenue is generated from interest-based lending, interest-bearing deposits, trade finance, and conventional financial instruments. The core business model of charging and receiving riba (interest) on loans and financial products is categorically prohibited under AAOIFI Shariah Standard No. 2. No Shariah-compliant banking window or subsidiary sufficiently offsets the group's conventional banking operations.",

    'FCMB' => "FCMB Group Plc is classified as non-halal under AAOIFI Shariah standards. The group's flagship subsidiary, First City Monument Bank, operates as a conventional commercial bank deriving its primary revenues from interest-based lending, interest-bearing deposits, and conventional credit facilities. The collection and payment of riba (interest) constitutes the fundamental business model of the bank, which is categorically prohibited under AAOIFI Shariah Standard No. 2.",

    'FIDELITYBK' => "Fidelity Bank Plc is classified as non-halal under AAOIFI Shariah standards. Fidelity Bank operates as a conventional commercial bank whose core income streams — interest on loans, overdrafts, and mortgages, alongside conventional deposit products — are based on riba (interest). This is categorically prohibited under AAOIFI Shariah Standard No. 2. The bank does not operate a Shariah-compliant window of sufficient scale to alter this classification.",

    'FIRSTHOLDCO' => "FirstHoldCo Plc (First HoldCo, parent of First Bank of Nigeria) is classified as non-halal under AAOIFI Shariah standards. First Bank of Nigeria is one of Africa's oldest conventional commercial banks, deriving the vast majority of its income from interest-based lending, conventional deposits, and non-Shariah-compliant financial instruments. The core business of receiving and paying riba (interest) is categorically prohibited under AAOIFI Shariah Standard No. 2.",

    'GTCO' => "Guaranty Trust Holding Company Plc (GTCO) is classified as non-halal under AAOIFI Shariah standards. GTBank, the flagship subsidiary, is a conventional commercial bank whose primary revenues derive from interest on loans, overdrafts, bonds, and conventional deposit products — all of which involve riba (interest). This is categorically prohibited under AAOIFI Shariah Standard No. 2. GTCO's non-banking subsidiaries (asset management, pension, payments) do not offset the core banking operations.",

    'INFINITY' => "Infinity Microfinance Bank (INFINITY) is classified as non-halal under AAOIFI Shariah standards. The company operates as a conventional microfinance and mortgage bank, providing interest-bearing home loans and credit facilities to retail and commercial clients. The charging and receiving of riba (interest) on mortgage loans constitutes the fundamental business activity, which is categorically prohibited under AAOIFI Shariah Standard No. 2.",

    'LIVINGTRUST' => "Living Trust Mortgage Bank Plc is classified as non-halal under AAOIFI Shariah standards. The company's entire business model is built on originating and managing conventional interest-bearing mortgage loans to residential and commercial property buyers. The charging of interest (riba) on mortgage facilities is the core and primary revenue generator, which is categorically prohibited under AAOIFI Shariah Standard No. 2.",

    'NPFMCRFBK' => "NPF Microfinance Bank Plc is classified as non-halal under AAOIFI Shariah standards. The bank provides conventional microfinance services — including interest-bearing loans, savings accounts, and credit facilities — primarily to Nigeria Police Force personnel and the public. The collection of riba (interest) on lending is the primary business activity, which is categorically prohibited under AAOIFI Shariah Standard No. 2.",

    'STANBIC' => "Stanbic IBTC Holdings Plc is classified as non-halal under AAOIFI Shariah standards. The group's flagship entity, Stanbic IBTC Bank, operates as a conventional commercial bank generating income from interest-based lending, corporate and investment banking, and conventional financial products. The core business of receiving and paying riba (interest) is categorically prohibited under AAOIFI Shariah Standard No. 2. Stanbic IBTC's asset management and insurance subsidiaries do not sufficiently offset the group's conventional banking operations.",

    'STERLINGNG' => "Sterling Financial Holdings Plc is classified as non-halal under AAOIFI Shariah standards. Sterling Bank, its primary subsidiary, operates as a conventional commercial bank whose income is principally derived from interest on loans, overdrafts, treasury bills, and bonds. Although Sterling has a non-interest banking subsidiary (Sterling Alternative Finance), this subsidiary does not alter the overall group classification, as the conventional interest-based banking operations remain the dominant business. The core receipt and payment of riba (interest) is categorically prohibited under AAOIFI Shariah Standard No. 2.",

    'UCAP' => "United Capital Plc is classified as non-halal under AAOIFI Shariah standards. Beyond its investment banking and asset management activities, United Capital directly operates UCEE Microfinance Bank and a Consumer Finance segment engaged in consumer lending and MSME financing. These are not incidental interest income streams — they are directly operated lending subsidiaries generating revenue from interest-bearing credit facilities. The operation of conventional lending businesses constitutes riba, which is categorically prohibited under AAOIFI Shariah Standard No. 2.",

    'UNITYBNK' => "Unity Bank Plc is classified as non-halal under AAOIFI Shariah standards. Unity Bank operates as a conventional commercial bank deriving its primary revenues from interest on loans, trade finance, and conventional deposit products. The collection and payment of riba (interest) constitutes the fundamental business model, which is categorically prohibited under AAOIFI Shariah Standard No. 2.",

    'VFDGROUP' => "VFD Group Plc is classified as non-halal under AAOIFI Shariah standards. The group's core business explicitly includes the operation of VFD Microfinance Bank (Vbank digital bank), Abbey Mortgage Bank, and Atiat Insurance Brokers — all of which are conventional interest-bearing or insurance-based financial services. These are named primary business segments, not incidental minority holdings. The direct operation of conventional banking, mortgage lending, and insurance constitutes riba and gharar, both categorically prohibited under AAOIFI Shariah Standards No. 2 and No. 26.",

    'WEMABANK' => "Wema Bank Plc is classified as non-halal under AAOIFI Shariah standards. Wema Bank operates as a conventional commercial bank, generating its primary income from interest on loans, overdrafts, mortgages, and conventional deposit products including its ALAT digital banking platform. The core business of charging and receiving riba (interest) is categorically prohibited under AAOIFI Shariah Standard No. 2.",

    'ZENITHBANK' => "Zenith Bank Plc is classified as non-halal under AAOIFI Shariah standards. Zenith Bank is one of Nigeria's largest conventional commercial banks, deriving the bulk of its income from interest on corporate and retail loans, trade finance, bonds, and treasury instruments. The core business of receiving and paying riba (interest) is categorically prohibited under AAOIFI Shariah Standard No. 2.",

    // ── INSURANCE ──────────────────────────────────────────────────────────────

    'AIICO' => "AIICO Insurance Plc is classified as non-halal under AAOIFI Shariah standards. AIICO operates as a conventional life and non-life insurance company. Traditional insurance contracts contain two elements prohibited in Islam: gharar (excessive uncertainty in the contract structure around claims and premiums) and riba (interest earned on investment reserves and premium float). The operation of conventional insurance is explicitly non-compliant under AAOIFI Shariah Standard No. 26.",

    'CORNERST' => "Cornerstone Insurance Plc is classified as non-halal under AAOIFI Shariah standards. The company provides conventional life and general insurance products. Conventional insurance contracts involve gharar (uncertainty and speculation in contract outcomes) and riba (interest income from investment of premium reserves), both of which are categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'CUSTODIAN' => "Custodian Investment Plc is classified as non-halal under AAOIFI Shariah standards. The group's primary operating subsidiaries — Custodian Life Assurance and Custodian and Allied Insurance — are conventional insurance companies whose business model involves gharar-laden insurance contracts and riba-based investment of premium reserves. These are categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'FTGINSURE' => "FTG Insurance Plc (Fortis Insurance) is classified as non-halal under AAOIFI Shariah standards. The company provides conventional general insurance products including fire, motor, marine, and liability insurance. Conventional insurance contracts involve gharar (contractual uncertainty) and riba (interest on premium investment reserves), both of which are categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'GUINEAINS' => "Guinea Insurance Plc is classified as non-halal under AAOIFI Shariah standards. Guinea Insurance operates as a conventional general insurance company offering fire, marine, motor, and liability insurance products. The company's insurance contracts involve gharar (excessive uncertainty) and its investment of premium reserves generates riba (interest income), both of which are categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'INTENEGINS' => "International Energy Insurance Plc is classified as non-halal under AAOIFI Shariah standards. The company provides conventional specialist insurance for the oil and energy sector, including property, marine cargo, and liability covers. Conventional insurance contracts contain gharar (contractual uncertainty) and riba (interest on invested reserves), both categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'LASACO' => "LASACO Assurance Plc is classified as non-halal under AAOIFI Shariah standards. LASACO provides conventional life and general insurance products. The company's insurance contracts involve gharar (uncertainty in claims outcomes vs. premiums paid) and its investment portfolio generates riba (interest income), both of which are categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'LINKASSURE' => "Linkage Assurance Plc is classified as non-halal under AAOIFI Shariah standards. The company provides conventional general insurance products including fire, motor, accident, and marine covers. Conventional insurance contracts involve gharar (excessive contractual uncertainty) and riba (interest from investment of premium reserves), both of which are categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'MBENEFIT' => "Mutual Benefits Assurance Plc is classified as non-halal under AAOIFI Shariah standards. Mutual Benefits provides conventional life and general insurance. The company's insurance contracts involve gharar (uncertainty in claim outcomes versus premiums paid) and its invested reserves generate riba (interest income), both categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'PRESTIGE' => "Prestige Assurance Plc is classified as non-halal under AAOIFI Shariah standards. Prestige Assurance operates as a conventional general insurance company. Its insurance contracts involve gharar (contractual uncertainty) and its investment of premium reserves generates riba (interest income), both of which are categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'REGALINS' => "Regency Assurance Plc (REGALINS) is classified as non-halal under AAOIFI Shariah standards. The company provides conventional life and general insurance products. Its insurance contracts involve gharar (excessive contractual uncertainty) and riba (interest income from investment of premium reserves), both of which are categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'ROYALEX' => "Royal Exchange Plc is classified as non-halal under AAOIFI Shariah standards. Royal Exchange operates conventional insurance and financial services businesses. Its insurance subsidiaries' contracts involve gharar (contractual uncertainty) and riba (interest from premium investment reserves), both categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'SOVRENINS' => "Sovereign Trust Insurance Plc is classified as non-halal under AAOIFI Shariah standards. Sovereign Trust provides conventional general insurance including fire, marine, motor, and liability covers. Its insurance contracts involve gharar (excessive contractual uncertainty) and its investment portfolio generates riba (interest income), both categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'STACO' => "STACO Insurance Plc is classified as non-halal under AAOIFI Shariah standards. STACO provides conventional life and general insurance products. Its insurance contracts involve gharar (uncertainty in claims and premiums) and its investment of premium reserves generates riba (interest income), both of which are categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'SUNUASSUR' => "Sunu Assurances Nigeria Plc is classified as non-halal under AAOIFI Shariah standards. The company provides conventional general insurance products. Its insurance contracts involve gharar (contractual uncertainty) and riba (interest income from invested premium reserves), both of which are categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'UNIVINSURE' => "Universal Insurance Plc is classified as non-halal under AAOIFI Shariah standards. Universal Insurance provides conventional general insurance products including fire, motor, marine, and accident covers. Its contracts involve gharar (excessive contractual uncertainty) and riba (interest from invested reserves), both categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'VERITASKAP' => "Veritas Kapital Assurance Plc is classified as non-halal under AAOIFI Shariah standards. The company provides conventional life and general insurance. Its insurance contracts involve gharar (contractual uncertainty in claim outcomes versus premiums) and riba (interest income from invested premium reserves), both of which are categorically prohibited under AAOIFI Shariah Standard No. 26.",

    'WAPIC' => "WAPIC Insurance Plc (now Coronation Insurance) is classified as non-halal under AAOIFI Shariah standards. WAPIC provides conventional life and general insurance products. Its insurance contracts involve gharar (excessive contractual uncertainty) and its investment portfolio generates riba (interest income), both categorically prohibited under AAOIFI Shariah Standard No. 26.",

    // ── BREWERIES ──────────────────────────────────────────────────────────────

    'GOLDBREW' => "Golden Guinea Breweries Plc is classified as non-halal under AAOIFI Shariah standards. The company's primary and sole business activity is the production and sale of alcoholic beverages including lager beer. The manufacture, distribution, and sale of alcohol (khamr) is categorically prohibited under Islamic law and AAOIFI Shariah screening standards, regardless of revenue share or financial ratios.",

    'GUINNESS' => "Guinness Nigeria Plc is classified as non-halal under AAOIFI Shariah standards. Guinness Nigeria's primary business is the brewing, marketing, and distribution of alcoholic beverages including Guinness stout, Harp lager, and other beer brands. The production and sale of alcohol (khamr) is categorically prohibited under Islamic law and AAOIFI Shariah screening standards, regardless of any non-alcoholic product lines.",

    'INTBREW' => "International Breweries Plc is classified as non-halal under AAOIFI Shariah standards. International Breweries (a subsidiary of AB InBev) produces and distributes alcoholic beverages including Trophy lager, Hero beer, and Budweiser in Nigeria. The production and sale of alcohol (khamr) is categorically prohibited under Islamic law and AAOIFI Shariah screening standards, regardless of revenue share from any non-alcoholic variants.",

    'NB' => "Nigerian Breweries Plc is classified as non-halal under AAOIFI Shariah standards. Nigerian Breweries (a subsidiary of Heineken) is Nigeria's largest brewer, producing and distributing alcoholic beverages including Star lager, Heineken, Gulder, Maltina, and Legend. The production, distribution, and sale of alcohol (khamr) is categorically prohibited under Islamic law and AAOIFI Shariah screening standards, regardless of any non-alcoholic product lines.",

    // ── GAMBLING / OTHER ───────────────────────────────────────────────────────

    'NSLTECH' => "Secure Electronic Technology Plc (NSLTECH, formerly National Sports Lottery Plc) is classified as non-halal under AAOIFI Shariah standards. The company directly operates a licensed national lottery business in Nigeria under an exclusive 15-year government licence, with stated operations covering lottery products, gaming, and wagering. Financial statements contain prize/winnings and ticket cost line items confirming that gambling activity is the core revenue generator. Gambling (maysir/qimar) is categorically prohibited under AAOIFI Shariah screening standards.",

    'TRANSCOHOT' => "Transcorp Hotels Plc is classified as non-halal under AAOIFI Shariah standards. Transcorp Hotels owns and operates Transcorp Hilton Abuja, which contains an on-site casino (40 slot machines, 9 table games including Blackjack and Poker) as well as bars and a nightclub — all actively marketed as core hotel amenities, not minor incidental features. Gambling income (maysir) and alcohol service are both categorically prohibited under AAOIFI Shariah standards. The casino and bar operations represent a material, named revenue stream that cannot be treated as below the AAOIFI 5% impermissible income threshold.",

    'LIVESTOCK' => "Livestock Feeds Plc is classified as non-halal under AAOIFI Shariah standards. The company's core activities include piggery (pig rearing) and the production and sale of pig feeds, in addition to poultry, fish farming, and crop cultivation. The rearing and sale of swine (pigs) and products derived from them is categorically prohibited under Islamic law (haram) as an absolute exclusion, regardless of revenue share. This categorical prohibition applies irrespective of financial ratios under AAOIFI Shariah screening standards.",

    // ── DEBT FUND ──────────────────────────────────────────────────────────────

    'NIDF' => "Nigeria Infrastructure Debt Fund (NIDF) is classified as non-halal under AAOIFI Shariah standards. NIDF is explicitly a debt fund whose core business is originating and investing in conventional fixed-income debt instruments — including senior loans, securitised debt, and bonds — in infrastructure projects across Nigeria. The fund targets a gross return of 3.00–4.50% above comparable FGN bond yields, with 80% of assets mandatorily held in senior debt and securitised instruments. Income to unit-holders is derived from interest coupons and fees received from borrowers, making interest-based lending the fundamental business activity. This constitutes riba, categorically prohibited under AAOIFI Shariah Standard No. 2.",

    // ── ETFs ───────────────────────────────────────────────────────────────────

    'VETGRIF30' => "Vetiva Griffin 30 ETF (VETGRIF30) is classified as non-halal under AAOIFI Shariah standards. The ETF tracks the NGX 30 Index, which is a market-capitalisation-weighted index of the 30 largest companies on the Nigerian Exchange. The NGX 30 Index includes — as core, structurally permanent constituents — multiple conventional banks (e.g., Zenith Bank, GTCO, UBA, Access Holdings) and other companies that independently fail the AAOIFI business-activity screen. A passive index tracker cannot exclude these impermissible constituents, making the fund non-compliant as a whole.",

    'STANBICETF30' => "Stanbic IBTC ETF 30 (STANBICETF30) is classified as non-halal under AAOIFI Shariah standards. The ETF tracks the same NGX 30 Index as VETGRIF30, a market-cap-weighted index of the 30 largest NGX-listed companies. The index permanently includes conventional banks (Zenith Bank, GTCO, UBA, Access Holdings, etc.) and other impermissible companies as core constituents. A passive tracker of a broad index that contains impermissible companies cannot achieve AAOIFI Shariah compliance, as the fund directly holds interests in non-halal businesses.",

    'VETBANK' => "Vetiva Banking ETF (VETBANK) is classified as non-halal under AAOIFI Shariah standards. The ETF tracks the NGX Banking Index, a sector index comprising the top 10 conventional (interest-based) commercial banks listed on the Nigerian Exchange. Every constituent of this index — including Zenith Bank, GTCO, UBA, Access Holdings, and others — independently fails the AAOIFI Shariah business-activity screen as conventional riba-based institutions. A fund that invests exclusively in a basket of impermissible businesses is itself impermissible under AAOIFI standards.",

    'GREENWETF' => "Greenwich Alpha ETF (GREENWETF) is classified as non-halal under AAOIFI Shariah standards. The ETF tracks the broad NGX All-Share Index, a market-cap-weighted index covering all listed companies on the Nigerian Exchange. The All-Share Index includes — as structurally embedded, market-cap-weighted constituents — conventional banks, insurers, breweries, and other companies that independently fail the AAOIFI business-activity screen. A broad all-market tracker cannot exclude these impermissible constituents and therefore cannot achieve Shariah compliance.",

    'VSPBONDETF' => "Vetiva S&P Nigeria Sovereign Bond ETF (VSPBONDETF) is classified as non-halal under AAOIFI Shariah standards. The ETF holds a basket of Federal Government of Nigeria (FGN) bonds and generates its total return from fixed coupon (interest) payments received from the Nigerian government. FGN bonds are conventional interest-bearing debt instruments. The receipt of fixed interest coupons on government bonds constitutes riba, which is categorically prohibited under AAOIFI Shariah Standard No. 2, regardless of the sovereign creditworthiness of the issuer.",

    'SIAMLETF40' => "SIAML Pension ETF 40 (SIAMLETF40) is classified as non-halal under AAOIFI Shariah standards. The ETF tracks the NGX Pension Index, a basket of the top 40 pension fund-eligible companies listed on the Nigerian Exchange across all sectors. The Pension Index includes — as permanent, structurally weighted constituents — multiple conventional commercial banks and insurance companies that independently fail the AAOIFI business-activity screen. A passive tracker of a broad multi-sector index containing impermissible companies cannot achieve AAOIFI Shariah compliance.",
];

$updated = 0;
$skipped = 0;

foreach ($reasons as $ticker => $reason) {
    $company = Company::where('symbol', $ticker)->first();
    if (!$company) {
        echo "❌ {$ticker} — not found in DB.\n";
        continue;
    }
    $company->activity_reason = $reason;
    $company->save();
    echo "✅ {$ticker}\n";
    $updated++;
}

echo "\nDone. {$updated} justifications written.\n";
