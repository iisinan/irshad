<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;
use App\Models\ComplianceHistory;

$json = file_get_contents(__DIR__.'/business_activity.json');
$records = json_decode($json, true);

$updated = 0;
$notFound = [];

foreach ($records as $record) {
    $ticker = strtoupper($record['ticker']);
    $status = $record['status']; // 'pass', 'fail', 'doubtful'
    $rationale = $record['rationale'];
    
    $company = Company::where('symbol', $ticker)->first();
    if (!$company) {
        $notFound[] = $ticker;
        continue;
    }
    
    // 1. Update or Create AaoifiScreening
    $screening = AaoifiScreening::where('company_id', $company->id)->latest()->first();
    if ($screening) {
        $screening->update([
            'business_status' => $status,
            'business_reasoning' => $rationale,
        ]);
    } else {
        $screening = AaoifiScreening::create([
            'company_id' => $company->id,
            'business_status' => $status,
            'business_reasoning' => $rationale,
            'final_status' => 'pending',
        ]);
    }
    
    // 2. If it is FAIL, immediately mark Company and StockStatus as non-halal
    if ($status === 'fail') {
        $oldStatus = $company->current_status;
        if ($oldStatus !== 'non-halal') {
            $company->update(['current_status' => 'non-halal']);
            StockStatus::updateOrCreate(
                ['company_id' => $company->id],
                ['status' => 'non-halal', 'reason' => 'Failed Business Activity: ' . $rationale, 'verified_by_scholar' => true, 'last_updated' => now()]
            );
            
            ComplianceHistory::create([
                'company_id' => $company->id, 
                'old_status' => $oldStatus, 
                'new_status' => 'non-halal', 
                'reason' => 'Failed Business Activity: ' . $rationale, 
                'changed_at' => now()
            ]);
        }
        $screening->update(['final_status' => 'non-halal']);
    } else if ($status === 'doubtful') {
        $oldStatus = $company->current_status;
        if ($oldStatus !== 'doubtful' && $oldStatus !== 'non-halal') {
            $company->update(['current_status' => 'doubtful']);
            StockStatus::updateOrCreate(
                ['company_id' => $company->id],
                ['status' => 'doubtful', 'reason' => 'Doubtful Business Activity: ' . $rationale, 'verified_by_scholar' => true, 'last_updated' => now()]
            );
            
            ComplianceHistory::create([
                'company_id' => $company->id, 
                'old_status' => $oldStatus, 
                'new_status' => 'doubtful', 
                'reason' => 'Doubtful Business Activity: ' . $rationale, 
                'changed_at' => now()
            ]);
        }
        $screening->update(['final_status' => 'doubtful']);
    }
    
    $updated++;
}

echo "Successfully updated $updated companies.\n";
if (count($notFound) > 0) {
    echo "Tickers not found in DB: " . implode(', ', $notFound) . "\n";
}

