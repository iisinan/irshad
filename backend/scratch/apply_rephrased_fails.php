<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;
use App\Models\Company;

$failsJson = file_get_contents(__DIR__ . '/rephrased_fails.json');
$updates = json_decode($failsJson, true);

$updatedCount = 0;

foreach ($updates as $symbol => $data) {
    $rephrased = $data['rephrased'];
    $company = Company::where('symbol', $symbol)->first();
    if (!$company) {
        echo "Company $symbol not found.\n";
        continue;
    }
    
    $screening = AaoifiScreening::where('company_id', $company->id)->first();
    if ($screening) {
        $reason = ['summary' => $rephrased];
        
        $screening->business_reasoning = json_encode($reason);
        $screening->save();
        $updatedCount++;
        echo "Updated $symbol\n";
    } else {
        echo "No screening found for $symbol\n";
    }
}

echo "Successfully updated $updatedCount non-compliant rationales.\n";
