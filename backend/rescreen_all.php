<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Services\AaoifiScreeningService;

$screeningService = app(AaoifiScreeningService::class);
$companies = Company::all();

$count = 0;
foreach ($companies as $company) {
    try {
        $screeningService->screenCompany($company);
        $count++;
    } catch (\Exception $e) {
        echo "Failed {$company->symbol}: " . $e->getMessage() . "\n";
    }
}
echo "Fully screened $count companies.\n";
