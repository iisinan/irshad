<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = \App\Models\Company::where('ticker', 'SCOA')->first();
if ($company) {
    $screening = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    echo "AAOIFI Screening:\n";
    echo "Debt Ratio: " . $screening->debt_ratio . "%\n";
    echo "Impermissible Income Ratio: " . $screening->impermissible_income_ratio . "%\n";
    
    $financials = \App\Models\CompanyFinancials::where('company_id', $company->id)->first();
    if ($financials) {
         echo "\nCompanyFinancials found:\n";
         echo "Total Assets/Market Cap: " . $financials->total_assets . " / " . $financials->market_cap . "\n";
    } else {
         echo "\nNo CompanyFinancials found.\n";
    }
} else {
    echo "SCOA not found.\n";
}
