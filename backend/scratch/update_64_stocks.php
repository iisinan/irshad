<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\StockStatus;
use App\Models\AaoifiScreening;
use Illuminate\Support\Facades\DB;

$updates = [
    'ABBEYBANK' => 'The core business involves conventional banking operations, including interest-based lending and deposits, which are non-compliant with Islamic finance principles regarding Riba (interest).',
    'ACCESSCORP' => 'As a conventional bank holding company, the primary business operations are centered on interest-based lending and deposits, which are fundamentally non-compliant with Islamic finance principles.',
    'AFRINSURE' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest) in the contract structures.',
    'AFRIPRUD' => 'The core business involves conventional financial services and operations, which present compliance concerns regarding interest-based transactions and structures.',
    'AIICO' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest) in the contract structures.',
    'AVAIF' => 'The fund focuses on providing debt financing for infrastructure projects. Its primary objective is to generate income for unit holders through private credit and debt instruments, which constitutes impermissible interest-based lending.',
    'AVACAP' => 'The company operates as an integrated financial services group, with core divisions including conventional investment banking, securities trading, and asset management, raising fundamental compliance concerns regarding interest-based financing.',
    'CHAMPION' => 'The company is primarily engaged in brewing and marketing alcoholic beverages (such as Champion Lager Beer), which is a categorically impermissible business activity.',
    'CMFC' => 'The company operates as a specialized finance and investment platform for the mining and commodities sector, with core activities including conventional capital structuring and financing solutions that involve interest-bearing debt.',
    'CNIF' => 'This is a closed-end debt fund that explicitly invests in loans, securities, and securitized debt instruments. As its core product relies on interest-based lending rather than permissible equity or property holding, it is non-compliant.',
    'CONHALLPLC' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'CORNERST' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'CUSTODIAN' => 'The company operates as a financial services holding group whose primary business segment is conventional insurance, which is non-compliant with Islamic finance principles.',
    'ELLAHLAKES' => 'While general agribusiness is permissible, the company is actively scaling commercial swine production (piggery). Swine farming is categorically excluded under standard Islamic screening criteria regardless of revenue materiality.',
    'ETI' => 'The core business involves conventional banking operations (Ecobank Transnational), including interest-based lending and deposits, which are fundamentally non-compliant.',
    'FCMB' => 'The core business involves conventional banking operations, including interest-based lending and deposits, which are fundamentally non-compliant.',
    'FIDELITYBK' => 'The core business involves conventional banking operations, including interest-based lending and deposits, which are fundamentally non-compliant.',
    'FIRSTHOLDCO' => 'As a conventional bank holding company, the primary business operations are centered on interest-based lending and deposits, which are fundamentally non-compliant.',
    'FTGINSURE' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'GOLDBREW' => 'The company is engaged in the brewing and production of alcoholic beverages, which is a categorically impermissible business activity.',
    'GTCO' => 'As a conventional bank holding company, the primary business operations are centered on interest-based lending and deposits, which are fundamentally non-compliant.',
    'GUINEAINS' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'GUINNESS' => 'The company is primarily engaged in the brewing and production of alcoholic beverages, which is a categorically impermissible business activity.',
    'IKEJAHOTEL' => 'The company operates hospitality properties, including the Federal Palace Hotels & Casino. The presence of gambling and alcohol sales as core revenue streams makes the business non-compliant.',
    'INFINITY' => 'The core business operates as a mortgage bank, which relies entirely on interest-based lending (Riba) and is thus fundamentally non-compliant.',
    'INTBREW' => 'The company is primarily engaged in the brewing and production of alcoholic beverages, which is a categorically impermissible business activity.',
    'INTENEGINS' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'LASACO' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'LINKASSURE' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'LIVESTOCK' => 'The company’s core agricultural activities include commercial piggery and the production and sale of pig feeds. Swine-related business is a categorical exclusion under standard Islamic screening criteria.',
    'LIVINGTRUST' => 'The core business operates as a mortgage bank, which relies entirely on interest-based lending (Riba) and is thus fundamentally non-compliant.',
    'MANSARD' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'MBENEFIT' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'MOFIREIF' => 'This is a government-backed mortgage lending vehicle. Its core business originates fixed-rate mortgage loans and provides construction financing guarantees. The reliance on interest-bearing lending makes it fundamentally non-compliant.',
    'NB' => 'The company is primarily engaged in the brewing and production of alcoholic beverages, which is a categorically impermissible business activity.',
    'NEM' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'NIDF' => 'The fund explicitly focuses on debt investments in infrastructure projects, deriving income from coupons and fees paid by borrowers. This constitutes interest-based lending and is fundamentally non-compliant.',
    'NPFMCRFBK' => 'The core business involves conventional microfinance banking, relying on interest-based lending (Riba), which is fundamentally non-compliant.',
    'NSLTECH' => 'The company operates a licensed national lottery business and gaming products. Revenue derived from prize winnings and ticket sales constitutes gambling activity, which is categorically impermissible.',
    'PRESTIGE' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'REGALINS' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'ROYALEX' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'SOVRENINS' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'STACO' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'STANBIC' => 'The core business involves conventional banking operations, including interest-based lending and deposits, which are fundamentally non-compliant.',
    'STERLINGNG' => 'The core business involves conventional banking operations, including interest-based lending and deposits, which are fundamentally non-compliant.',
    'SUNUASSUR' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'TRANSCOHOT' => 'The company operates the Transcorp Hilton, which includes an on-site casino and gambling tables marketed as a core hotel amenity, rendering the business non-compliant.',
    'UBA' => 'The core business involves conventional banking operations, including interest-based lending and deposits, which are fundamentally non-compliant.',
    'UCAP' => 'The company directly operates a microfinance bank and a consumer finance segment engaged in lending. These are core, operated lending subsidiaries rather than incidental investments, rendering the business non-compliant.',
    'UNITYBNK' => 'The core business involves conventional banking operations, including interest-based lending and deposits, which are fundamentally non-compliant.',
    'UNIVINSURE' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'VERITASKAP' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'VFDGROUP' => 'The core business operations heavily feature conventional microfinance, mortgage banking, insurance brokerage, and asset leasing. The direct operation of these interest-bearing debt and insurance segments renders the business non-compliant.',
    'WAPIC' => 'The core business involves conventional insurance operations, which are non-compliant with Islamic finance principles due to the presence of Gharar (uncertainty) and Riba (interest).',
    'WEMABANK' => 'The core business involves conventional banking operations, including interest-based lending and deposits, which are fundamentally non-compliant.',
    'ZENITHBANK' => 'The core business involves conventional banking operations, including interest-based lending and deposits, which are fundamentally non-compliant.',
    'ZICHIS' => 'While general agriculture is permissible, the company explicitly lists swine farming (piggery) as a core business line. This is a categorical exclusion under standard Islamic screening criteria regardless of revenue materiality.',
    'VETGRIF30' => 'The ETF tracks an index holding conventional banks and other impermissible companies as core portfolio constituents, rendering the fund non-compliant.',
    'STANBICETF30' => 'The ETF directly tracks an index containing conventional banks and other impermissible companies as core portfolio constituents, rendering the fund non-compliant.',
    'VETBANK' => 'The ETF is a dedicated sector fund tracking conventional interest-based banks. Investing exclusively in impermissible financial institutions renders the fund non-compliant.',
    'GREENWETF' => 'The ETF tracks the broad All-Share Index, which fundamentally includes conventional banks, insurers, and breweries as core market-cap-weighted constituents.',
    'VSPBONDETF' => 'The ETF tracks a basket of sovereign bonds and generates returns from fixed coupon income. Such conventional fixed-income instruments are interest-based (Riba) and non-compliant.',
    'SIAMLETF40' => 'The ETF tracks a broad-based pension index which inherently includes conventional banks and insurers as core constituents, rendering the fund non-compliant.'
];

$count = 0;

foreach ($updates as $symbol => $reason) {
    $company = Company::where('symbol', $symbol)->first();
    if ($company) {
        $status = StockStatus::where('company_id', $company->id)->first();
        if ($status) {
            $status->reason = $reason;
            // Keeping status as non-halal in DB to respect check constraint
            $status->status = 'non-halal'; 
            $status->save();
        } else {
            StockStatus::create([
                'company_id' => $company->id,
                'status' => 'non-halal',
                'reason' => $reason,
                'verified_by_scholar' => false,
                'last_updated' => now()
            ]);
        }
        
        $screening = AaoifiScreening::where('company_id', $company->id)->latest()->first();
        if ($screening) {
            $screening->business_reasoning = $reason;
            $screening->final_status = 'non-halal';
            $screening->save();
        }
        
        $company->current_status = 'non-halal';
        $company->save();
        
        echo "Updated $symbol\n";
        $count++;
    } else {
        echo "WARNING: $symbol not found in database.\n";
    }
}

echo "Successfully applied AI-rephrased justifications for $count stocks.\n";
