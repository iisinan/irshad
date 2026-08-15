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

$updatedCount = 0;
$skippedCount = 0;
$missingCount = 0;

while (($data = fgetcsv($handle)) !== FALSE) {
    $row = array_combine($header, $data);
    $symbol = trim($row['Symbol']);
    $newReasoning = trim($row['Business Reasoning / Justification']);
    
    $success = false;
    $retries = 3;
    
    while (!$success && $retries > 0) {
        try {
            $c = Company::where('symbol', $symbol)->first();
            if (!$c) {
                $missingCount++;
                $success = true;
                break;
            }
            
            $aaoifi = AaoifiScreening::where('company_id', $c->id)->first();
            if (!$aaoifi) {
                $missingCount++;
                $success = true;
                break;
            }
            
            $db_just_raw = $aaoifi->business_reasoning;
            $parsed = is_string($db_just_raw) ? json_decode($db_just_raw, true) : $db_just_raw;
            
            if (!is_array($parsed)) {
                $parsed = [];
            }
            
            if (isset($parsed['summary']) && $parsed['summary'] === $newReasoning) {
                $skippedCount++;
                $success = true;
                break;
            }
            
            $parsed['summary'] = $newReasoning;
            
            $aaoifi->business_reasoning = json_encode($parsed);
            $aaoifi->save();
            
            $updatedCount++;
            $success = true;
        } catch (\Exception $e) {
            echo "Error processing $symbol: " . $e->getMessage() . "\n";
            DB::reconnect();
            sleep(1);
            $retries--;
        }
    }
}

fclose($handle);
echo "Successfully updated: $updatedCount. Skipped (already matching): $skippedCount. Missing: $missingCount.\n";
