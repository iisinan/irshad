<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use Illuminate\Support\Facades\DB;

$csvFile = '/Users/sinan/Herd/irshad/backend/scratch/stocks_financial_data.csv';
$handle = fopen($csvFile, 'r');
$header = fgetcsv($handle);

$updates = [];
$companies = Company::pluck('id', 'symbol')->toArray();
$aaoifis = AaoifiScreening::all()->keyBy('company_id');

while (($data = fgetcsv($handle)) !== FALSE) {
    $row = array_combine($header, $data);
    $symbol = trim($row['Symbol']);
    $newReasoning = trim($row['Business Reasoning / Justification']);
    
    if (!isset($companies[$symbol])) continue;
    $cId = $companies[$symbol];
    
    if (!isset($aaoifis[$cId])) continue;
    $aaoifi = $aaoifis[$cId];
    
    $db_just_raw = $aaoifi->business_reasoning;
    $parsed = is_string($db_just_raw) ? json_decode($db_just_raw, true) : $db_just_raw;
    
    if (!is_array($parsed)) {
        $parsed = [];
    }
    
    if (isset($parsed['summary']) && $parsed['summary'] === $newReasoning) {
        continue;
    }
    
    $parsed['summary'] = $newReasoning;
    $updates[$aaoifi->id] = json_encode($parsed);
}
fclose($handle);

if (empty($updates)) {
    echo "Nothing to update.\n";
    exit;
}

DB::transaction(function () use ($updates) {
    foreach ($updates as $id => $json) {
        DB::table('aaoifi_screenings')
            ->where('id', $id)
            ->update(['business_reasoning' => $json]);
    }
});

echo "Successfully updated " . count($updates) . " records.\n";
