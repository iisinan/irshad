<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\Financial;
use App\Services\AaoifiComplianceService;

$symbol = 'JBERGER';
$company = Company::where('symbol', $symbol)->first();
if (!$company) {
    echo "Company not found.\n";
    exit;
}

// Ensure the market cap is retrieved
$marketCap = $company->market_cap > 0 ? $company->market_cap : 0;
echo "Market Cap: " . $marketCap . "\n";

// Update or create financial record
$financial = Financial::updateOrCreate(
    ['company_id' => $company->id, 'reporting_period' => '2026-Q2'],
    [
        'total_revenue' => 424562607000,
        'total_assets' => 1071272602000,
        'total_debt' => 77449703000,
        'cash_and_equivalents' => 168804545000,
        'interest_bearing_securities' => 0,
        'interest_income' => 8984939000,
        'market_cap' => $marketCap,
        'currency' => 'NGN'
    ]
);

// Evaluate compliance
$service = new AaoifiComplianceService();
$service->evaluateCompliance($company, $financial);

// Record screening history
\App\Models\AaoifiScreening::updateOrCreate(
    ['company_id' => $company->id],
    [
        'financial_data_used' => json_encode($financial->toArray()),
        'final_status' => $company->current_status,
        'screening_date' => now()
    ]
);

echo "Updated $symbol to status: {$company->current_status}\n";

// Clear cache
\Illuminate\Support\Facades\Cache::tags(['stocks'])->flush();
echo "Cache cleared.\n";
