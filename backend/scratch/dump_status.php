<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;
use App\Models\Company;

$screenings = AaoifiScreening::with('company')->get();

$failedBusiness = [];
$nonHalal = [];
$halal = [];

foreach ($screenings as $s) {
    if (!$s->company) continue;
    $symbol = $s->company->symbol;
    if ($s->business_status === 'fail') {
        $failedBusiness[] = $symbol;
    }
    if ($s->final_status === 'non-halal') {
        $nonHalal[] = $symbol;
    } else {
        $halal[] = $symbol;
    }
}

echo "Total business fails: " . count($failedBusiness) . "\n";
echo "Total non-halal: " . count($nonHalal) . "\n";
echo "Total halal: " . count($halal) . "\n\n";

file_put_contents('/Users/sinan/Herd/irshad/backend/scratch/db_status.json', json_encode([
    'failed_business' => $failedBusiness,
    'non_halal' => $nonHalal,
    'halal' => $halal
], JSON_PRETTY_PRINT));

echo "Data written to scratch/db_status.json\n";
