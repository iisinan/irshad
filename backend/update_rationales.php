<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$categories = [
    'Banks' => [
        'symbols' => ['ABBEYBANC', 'ACCESSCORP', 'ETI', 'FCMB', 'FIDELITYBK', 'FIRSTHOLDCO', 'FBNH', 'GTCO', 'STANBIC', 'STERLINGNG', 'UBA', 'UNITYBNK', 'WEMABANK', 'ZENITHBANK', 'INFINITY', 'LIVINGTRUST'],
        'summary' => "The company operates as a conventional financial institution. Its core business model relies on interest-based lending and deposits (Riba), which is strictly prohibited under Shariah guidelines, rendering the stock categorically non-compliant."
    ],
    'Insurance' => [
        'symbols' => ['AFRINSURE', 'AFRIPRUD', 'AIICO', 'CONHALLPLC', 'CORNERST', 'CUSTODIAN', 'GUINEAINS', 'LASACO', 'LINKASSURE', 'MANSARD', 'MBENEFIT', 'NEM', 'PRESTIGE', 'REGALINS', 'ROYALEX', 'SOVRENINS', 'STACO', 'SUNUASSUR', 'UNIVINSURE', 'VERITASKAP', 'WAPIC'],
        'summary' => "The company's primary business operations involve conventional insurance. Conventional insurance models incorporate elements of interest (Riba) and excessive uncertainty (Gharar) in their contract structures, making the business categorically non-compliant with Shariah principles."
    ],
    'Breweries' => [
        'symbols' => ['CHAMPION', 'GOLDBREW', 'GUINNESS', 'INTBREW', 'NB'],
        'summary' => "The company operates as a brewery, with the manufacturing and marketing of alcoholic beverages serving as its primary source of revenue. As the production and sale of alcohol are strictly prohibited in Islam, the company's core operations are categorically non-compliant."
    ],
    'Pig_Farming' => [
        'symbols' => ['ELLAHLAKES', 'LIVESTOCK'],
        'summary' => "While some of the company's agricultural operations may be permissible, official disclosures explicitly identify pig farming and related swine operations as part of its core business. Swine production is a categorical exclusion under Shariah principles, resulting in a non-compliant status irrespective of its revenue contribution."
    ],
    'Gambling_Casinos' => [
        'symbols' => ['IKEJAHOTEL', 'TRANSCOHOT'],
        'summary' => "While the company operates in the permissible hospitality sector, it actively manages and markets on-site casinos, gambling facilities, and alcohol sales as core amenities and revenue lines. Due to the explicit involvement in gambling and alcohol, the business is classified as categorically non-compliant."
    ],
    'Lottery' => [
        'symbols' => ['NSLTECH'],
        'summary' => "The company's primary operations involve running a licensed national lottery and gaming business. As gambling and lottery activities are strictly prohibited under Shariah principles, the company's core business model is categorically non-compliant."
    ],
    'Debt_Funds' => [
        'symbols' => ['AVAIF', 'CMF', 'NDF', 'MOFIREIF', 'VSPBONDETF'],
        'summary' => "The entity operates primarily as a debt fund, mortgage vehicle, or fixed-income instrument, focusing on generating returns through interest-bearing loans, bonds, or debt financing. Because its core strategy relies on earning and distributing interest (Riba), the asset is categorically non-compliant."
    ],
    'Conventional_Financial_Services' => [
        'symbols' => ['AVACAP', 'CMFC', 'UCAP', 'VFDGROUP'],
        'summary' => "The company operates as an integrated financial services and investment group, with core divisions engaged in conventional investment banking, debt financing, or microfinance lending. These operations rely fundamentally on interest-based transactions (Riba), rendering the business categorically non-compliant."
    ],
    'Conventional_ETFs' => [
        'symbols' => ['VETGRIF30', 'STANBICETF30', 'VETBANK', 'GREENWETF', 'SIAMLETF40'],
        'summary' => "This Exchange Traded Fund (ETF) tracks an index that heavily includes conventional banks, insurance companies, breweries, or other fundamentally non-compliant constituents. Because its core portfolio incorporates these impermissible assets, the fund is categorically non-compliant."
    ]
];

$count = 0;
foreach ($categories as $category => $data) {
    $symbols = $data['symbols'];
    $summary = $data['summary'];

    $companies = App\Models\Company::whereIn('symbol', $symbols)->get();
    foreach ($companies as $company) {
        $screening = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
        if ($screening) {
            $screening->business_status = 'fail';
            $screening->final_status = 'non-compliant';
            $reasoning = is_array($screening->business_reasoning) ? $screening->business_reasoning : json_decode($screening->business_reasoning, true) ?? [];
            $reasoning['summary'] = $summary;
            $screening->business_reasoning = $reasoning;
            $screening->save();
        } else {
            App\Models\AaoifiScreening::create([
                'company_id' => $company->id,
                'business_status' => 'fail',
                'final_status' => 'non-compliant',
                'business_reasoning' => ['summary' => $summary]
            ]);
        }

        $stockStatus = App\Models\StockStatus::where('company_id', $company->id)->first();
        if ($stockStatus) {
            $stockStatus->status = 'non-compliant';
            $stockStatus->save();
        } else {
            App\Models\StockStatus::create(['company_id' => $company->id, 'status' => 'non-compliant']);
        }
        
        $count++;
    }
}

echo "Successfully updated $count non-compliant companies with rephrased justification summaries!\n";
