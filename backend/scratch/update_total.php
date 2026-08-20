<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Models\Financial;
use App\Services\AaoifiComplianceService;

$company = Company::where('symbol', 'TOTAL')->first();

if (!$company) {
    echo "Company TOTAL not found\n";
    exit;
}

$financial = Financial::updateOrCreate(
    ['company_id' => $company->id, 'reporting_period' => '2026-Q2'],
    [
        'total_revenue' => 443990701000,
        'total_assets' => 403008890000,
        'total_debt' => 75695416000,
        'cash_and_equivalents' => 38605766000,
        'interest_bearing_securities' => 0,
        'interest_income' => 918945000,
    ]
);

$service = new AaoifiComplianceService();
$service->evaluateCompliance($company, $financial);

echo "TOTAL updated successfully for 2026-Q2.\n";
\Illuminate\Support\Facades\Artisan::call('cache:clear');
echo "Caches cleared.\n";
