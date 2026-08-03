<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\Financial;

$company = Company::where('symbol', 'ARADEL')->first();
if ($company->latestFinancial) {
    $company->latestFinancial->update(['market_cap' => $company->market_cap]);
    echo "Updated financial market cap to " . $company->market_cap . "\n";
    
    // Recalculate AAOIFI
    $service = app(App\Services\AaoifiComplianceService::class);
    $service->evaluateCompliance($company, $company->latestFinancial, $company->sector);
    
    $screen = app(App\Services\AaoifiScreeningService::class);
    $screen->screenCompany($company);
}

