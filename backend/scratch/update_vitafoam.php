<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Models\Financial;
use App\Services\AaoifiComplianceService;

$company = Company::where('symbol', 'VITAFOAM')->first();

if (!$company) {
    echo "Company VITAFOAM not found\n";
    exit;
}

$financial = Financial::updateOrCreate(
    ['company_id' => $company->id, 'reporting_period' => '2026-Q3'],
    [
        'total_revenue' => 91212764000,
        'total_assets' => 70156053000,
        'total_debt' => 2426553000,
        'cash_and_equivalents' => 14293909000,
        'interest_bearing_securities' => 0,
        'interest_income' => 427741000,
    ]
);

$service = new AaoifiComplianceService();
$service->evaluateCompliance($company, $financial);

echo "VITAFOAM updated successfully for 2026-Q3.\n";
\Illuminate\Support\Facades\Artisan::call('cache:clear');
echo "Caches cleared.\n";
