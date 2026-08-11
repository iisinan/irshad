<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\StockStatus;

$company = Company::where('symbol', 'NAHCO')->first();
if ($company) {
    $statusRecord = StockStatus::where('company_id', $company->id)->first();
    if ($statusRecord) {
        $statusRecord->reason = null;
        $statusRecord->save();
        echo "Cleared NAHCO status reason. Frontend will now use standard text.\n";
    }
}
