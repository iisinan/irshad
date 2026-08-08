<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$jsonPath = "/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/scratch/non_halal_excel.json";
$excelData = json_decode(file_get_contents($jsonPath), true);
$count = 0;

foreach($excelData as $ticker => $exReason) {
    $company = \App\Models\Company::where("symbol", $ticker)->first();
    if($company) {
        $status = \App\Models\StockStatus::where("company_id", $company->id)->first();
        if($status && $status->status === 'non-halal') {
            $newReason = 'Failed Rule 1: Business Activity Check. ' . $exReason;
            
            // Fix aaoifi_screenings as well
            $screening = \App\Models\AaoifiScreening::where('company_id', $company->id)->latest()->first();
            if ($screening) {
                $screening->business_reasoning = $exReason;
                $screening->save();
            }
            
            $status->reason = $newReason;
            $status->save();
            echo "Updated rationale for $ticker\n";
            $count++;
        }
    }
}
echo "Fixed $count stock statuses successfully!\n";
