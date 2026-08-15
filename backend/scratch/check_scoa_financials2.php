<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = \App\Models\Company::where('name', 'iLIKE', '%S C O A%')->first();
if ($company) {
    $screening = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    echo "AAOIFI Screening Table:\n";
    echo "Debt Ratio: " . ($screening->debt_ratio ?? 'null') . "%\n";
    echo "Impermissible Income Ratio: " . ($screening->impermissible_income_ratio ?? 'null') . "%\n";
    
    $financials = \App\Models\CompanyFinancials::where('company_id', $company->id)->first();
    if ($financials) {
         echo "\nCompanyFinancials Table:\n";
         echo "Total Debt: " . $financials->total_debt . "\n";
         echo "Total Assets: " . $financials->total_assets . "\n";
         echo "Market Cap: " . $financials->market_cap . "\n";
         echo "Impermissible Income: " . $financials->impermissible_income . "\n";
         echo "Total Revenue: " . $financials->total_revenue . "\n";
    } else {
         echo "\nNo raw financial data found in CompanyFinancials table.\n";
    }
} else {
    echo "SCOA not found.\n";
}
