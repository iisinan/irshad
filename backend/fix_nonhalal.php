<?php

// Fix data integrity
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\StockStatus;
use App\Services\AaoifiComplianceService;

echo "Updating sectors...\n";
$knownBanks = ['FIDELITYBK', 'FCMB', 'FIRSTHOLDCO', 'ACCESS', 'ZENITHBANK', 'UBA', 'GTCO', 'STANBIC', 'STERLINGNG', 'WEMABANK', 'UNITYBNK', 'UNIONDICON', 'JAIZBANK'];

Company::whereIn('symbol', $knownBanks)->update(['sector' => 'Banks']);

echo "Securing Jaiz Bank scholar override...\n";
$jaiz = Company::where('symbol', 'JAIZBANK')->first();
if ($jaiz) {
    StockStatus::where('company_id', $jaiz->id)->update([
        'verified_by_scholar' => true,
        'status' => 'halal',
        'reason' => 'Manual scholar override (Jaiz is a fully Islamic Bank)'
    ]);
}

echo "Re-evaluating all companies...\n";
$service = new AaoifiComplianceService();
$companies = Company::with('financials')->get();

foreach ($companies as $company) {
    $financials = $company->financials()->latest()->first();
    if ($financials) {
        $service->evaluateCompliance($company, $financials);
    }
}

echo "Clearing caches...\n";
\Illuminate\Support\Facades\Cache::flush();

echo "Done.\n";
