<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Cache;
use App\Models\Company;

$company = Company::where('symbol', 'NAHCO')->first();
if ($company) {
    echo "Is company cached? " . (Cache::has("company_{$company->symbol}") ? "Yes" : "No") . "\n";
    echo "Is aaoifi report cached? " . (Cache::has("aaoifi_report_{$company->id}") ? "Yes" : "No") . "\n";
}
