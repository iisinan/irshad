<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\Financial;
use App\Services\NgxPulseScraperService;

$company = Company::where('symbol', 'ARADEL')->first();
if (!$company) die("Aradel not found");
echo "Current market cap: " . $company->market_cap . "\n";
if ($company->latestFinancial) {
    echo "Financial market cap: " . $company->latestFinancial->market_cap . "\n";
}

$scraper = app(NgxPulseScraperService::class);
$data = $scraper->scrapeMarketData('ARADEL');
print_r($data);

if (isset($data['market_cap'])) {
    $company->update(['market_cap' => $data['market_cap']]);
    if ($company->latestFinancial) {
        $company->latestFinancial->update(['market_cap' => $data['market_cap']]);
    }
    echo "Updated market cap to " . $data['market_cap'] . "\n";
    
    // Recalculate AAOIFI
    $service = app(App\Services\AaoifiComplianceService::class);
    $service->evaluateCompliance($company, $company->latestFinancial, $company->sector);
    
    $screen = app(App\Services\AaoifiScreeningService::class);
    $screen->screenCompany($company);
}

