<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\Financial;
use App\Services\AaoifiScreeningService;

$company = Company::where('symbol', 'LEGENDINT')->first();
if (!$company) {
    echo "LEGENDINT not found.\n";
    exit;
}

// Ensure financials exist
$financials = Financial::where('company_id', $company->id)->first();
if (!$financials) {
    $financials = new Financial(['company_id' => $company->id]);
}

$financials->total_assets = 10136891000;
$financials->total_debt = 7428137000;
$financials->cash_and_equivalents = 33236000 + 5520000000; // Adding restricted cash as well just in case, but let's see. Wait, in previous extraction I only used 33236000. Let's use 33236000 as previous.
$financials->cash_and_equivalents = 33236000;
$financials->interest_bearing_securities = 0;
$financials->interest_income = 61017000;
$financials->total_revenue = 817071000;
$financials->market_cap = 14272472136;
$financials->save();

// Set live market cap if null or different
$company->market_cap = $financials->market_cap;
$company->save();

$service = app(AaoifiScreeningService::class);
$result = $service->screenCompany($company);

echo "--- LEGEND INTERNET PLC AAOIFI TEST ---\n";
echo "Debt Ratio: {$result->debt_ratio}% ({$result->debt_status})\n";
echo "Cash Ratio: {$result->cash_ratio}% ({$result->cash_status})\n";
echo "Income Ratio: {$result->impermissible_income_ratio}% ({$result->impermissible_income_status})\n";
echo "Final Verdict: {$result->final_status}\n";
