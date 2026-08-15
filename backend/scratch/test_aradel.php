<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\Financial;
use App\Services\AaoifiScreeningService;

$company = Company::where('symbol', 'ARADEL')->first();
if (!$company) {
    echo "ARADEL not found.\n";
    exit;
}

// Ensure financials exist
$financials = Financial::where('company_id', $company->id)->first();
if (!$financials) {
    $financials = new Financial(['company_id' => $company->id]);
}

$financials->total_assets = 10875453382000;
$financials->total_debt = 1811587252000;
$financials->cash_and_equivalents = 1765086751000;
$financials->interest_bearing_securities = 36208423000;
$financials->interest_income = 23674798000;
$financials->total_revenue = 2491454085000;
$financials->market_cap = 6158930656264;
$financials->save();

// Set live market cap if null
if (!$company->market_cap) {
    $company->market_cap = $financials->market_cap;
    $company->save();
}

$service = app(AaoifiScreeningService::class);
$result = $service->screenCompany($company);

echo "--- ARADEL HOLDINGS PLC AAOIFI TEST ---\n";
echo "Debt Ratio: {$result->debt_ratio}% ({$result->debt_status})\n";
echo "Cash Ratio: {$result->cash_ratio}% ({$result->cash_status})\n";
echo "Income Ratio: {$result->impermissible_income_ratio}% ({$result->impermissible_income_status})\n";
echo "Final Verdict: {$result->final_status}\n";
