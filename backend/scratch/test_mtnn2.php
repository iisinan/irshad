<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\Financial;
use App\Services\AaoifiScreeningService;

$company = Company::where('symbol', 'MTNN')->first();
if (!$company) {
    echo "MTNN not found.\n";
    exit;
}

// Ensure financials exist
$financials = Financial::where('company_id', $company->id)->first();
if (!$financials) {
    $financials = new Financial(['company_id' => $company->id]);
}

$financials->total_assets = 5972987000000;
$financials->total_debt = 342591000000;
$financials->cash_and_equivalents = 515770000000;
$financials->interest_bearing_securities = 436252000000;
$financials->interest_income = 46797000000;
$financials->total_revenue = 2993064000000;
// Not overwriting market_cap to test if AaoifiScreeningService falls back correctly to Company's live market cap
$financials->save();

$service = app(AaoifiScreeningService::class);
$result = $service->screenCompany($company);

echo "--- MTNN PLC AAOIFI TEST ---\n";
echo "Debt Ratio: {$result->debt_ratio}% ({$result->debt_status})\n";
echo "Cash Ratio: {$result->cash_ratio}% ({$result->cash_status})\n";
echo "Income Ratio: {$result->impermissible_income_ratio}% ({$result->impermissible_income_status})\n";
echo "Final Verdict: {$result->final_status}\n";
