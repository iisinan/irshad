<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

$screenings = AaoifiScreening::whereIn('business_status', ['pass', 'halal'])->get();

$missing = [];

foreach ($screenings as $s) {
    $fd = is_string($s->financial_data_used) ? json_decode($s->financial_data_used, true) : $s->financial_data_used;
    if (!$fd) $fd = [];

    $totalAssets = floatval($fd['total_assets'] ?? 0);
    $totalDebt = floatval($fd['total_debt'] ?? 0);
    $cash = floatval($fd['cash'] ?? 0);
    $securities = floatval($fd['interest_bearing_securities'] ?? 0);
    $totalRevenue = floatval($fd['total_revenue'] ?? 0);

    $cashAndSec = $cash + $securities;

    $hasFinancialData = count($fd) > 0 && ($totalAssets > 0 || $totalDebt > 0 || $totalRevenue > 0 || $cashAndSec > 0);

    if (!$hasFinancialData) {
        $company = Company::find($s->company_id);
        if ($company) {
            $missing[] = $company->symbol . ' (' . $company->name . ')';
        }
    }
}

echo "Found " . count($missing) . " companies:\n";
foreach ($missing as $m) {
    echo "- " . $m . "\n";
}

