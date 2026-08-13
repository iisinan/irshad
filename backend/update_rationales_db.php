<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;
use Illuminate\Support\Facades\DB;

$jsonFile = __DIR__.'/cleaned_rationales.json';
if (!file_exists($jsonFile)) {
    echo "JSON file not found!\n";
    exit(1);
}

$data = json_decode(file_get_contents($jsonFile), true);

$updatedCount = 0;
foreach ($data as $symbol => $rationale) {
    $company = Company::where('symbol', $symbol)->first();
    if ($company) {
        // Update company
        $company->activity_reason = $rationale;
        $company->save();

        // Update AaoifiScreening
        $screening = AaoifiScreening::where('company_id', $company->id)->first();
        if ($screening) {
            $screening->business_reasoning = $rationale;
            $screening->save();
        }

        // Update StockStatus
        $status = StockStatus::where('company_id', $company->id)->first();
        if ($status) {
            $status->reason = $rationale;
            $status->save();
        }

        $updatedCount++;
    }
}

echo "Successfully updated rationale for {$updatedCount} failed companies.\n";
