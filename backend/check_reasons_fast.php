<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$jsonPath = "/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/scratch/non_halal_excel.json";
$excelData = json_decode(file_get_contents($jsonPath), true);

$companies = \App\Models\Company::whereIn('symbol', array_keys($excelData))->get()->keyBy('symbol');
$companyIds = $companies->pluck('id');
$statuses = \App\Models\StockStatus::whereIn('company_id', $companyIds)->get()->keyBy('company_id');

$mismatches = [];
$total = count($excelData);
$statusMismatches = [];

foreach($excelData as $ticker => $exReason) {
    if(!isset($companies[$ticker])) {
        echo "No company found for $ticker\n";
        continue;
    }
    
    $company = $companies[$ticker];
    if(!isset($statuses[$company->id])) {
        echo "No status for $ticker\n";
        continue;
    }
    
    $status = $statuses[$company->id];
    
    if ($status->status !== 'non-halal') {
        $statusMismatches[] = "$ticker is marked as {$status->status} in DB, but non-halal in Excel.";
    }
    
    $dbReason = trim(str_replace(["\r", "\n", "\t"], " ", $status->reason));
    $exReason = trim(str_replace(["\r", "\n", "\t"], " ", $exReason));
    
    $dbReasonNorm = preg_replace("/\s+/", " ", $dbReason);
    $exReasonNorm = preg_replace("/\s+/", " ", $exReason);
    
    if ($dbReasonNorm != $exReasonNorm && strcasecmp($dbReasonNorm, $exReasonNorm) !== 0) {
        $mismatches[$ticker] = ["db" => $dbReasonNorm, "excel" => $exReasonNorm];
    }
}

if(count($statusMismatches) > 0) {
    echo "\nSTATUS MISMATCHES:\n";
    foreach($statusMismatches as $sm) echo "- $sm\n";
}

if(count($mismatches) == 0) {
    echo "\nChecked $total stocks. ALL rationales match PERFECTLY!\n";
} else {
    echo "\nFound " . count($mismatches) . " rationale mismatches out of $total stocks:\n";
    foreach($mismatches as $t => $data) {
        echo "- $t\n  DB: {$data["db"]}\n  Excel: {$data["excel"]}\n\n";
    }
}
