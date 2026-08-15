<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;
use App\Models\Company;

$data = json_decode(file_get_contents('/Users/sinan/Herd/irshad/backend/scratch/rephrased_fails.json'), true);
$updatedCount = 0;

foreach ($data as $symbol => $v) {
    $company = Company::where('symbol', $symbol)->first();
    if (!$company) {
        echo "Company $symbol not found.\n";
        continue;
    }
    
    $screening = AaoifiScreening::where('company_id', $company->id)->first();
    if ($screening) {
        $reason = is_string($screening->business_reasoning) ? json_decode($screening->business_reasoning, true) : $screening->business_reasoning;
        if (!is_array($reason)) {
            $reason = [];
        }
        $reason['summary'] = $v['rephrased'];
        
        $screening->business_reasoning = json_encode($reason);
        $screening->save();
        $updatedCount++;
        echo "Updated $symbol\n";
    }
}

echo "Successfully updated $updatedCount rationales.\n";
