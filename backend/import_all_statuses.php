<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// 1. First get ALL stocks from Excel
$jsonPath = "/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/scratch/all_excel.json";
$excelData = json_decode(file_get_contents($jsonPath), true);

$count = 0;
foreach($excelData as $row) {
    $ticker = $row['Ticker'] ?? null;
    $status = $row['Business Activity Screen'] ?? null;
    $reason = $row['Rationale'] ?? null;
    
    if (!$ticker) continue;
    
    $status = strtoupper(trim($status));
    $bs = 'doubtful';
    if ($status === 'PASS' || $status === 'HALAL' || $status === 'COMPLIANT') {
        $bs = 'pass';
    } elseif ($status === 'FAIL' || $status === 'NON-COMPLIANT') {
        $bs = 'fail';
    } elseif (str_contains($status, 'REVIEW') || str_contains($status, 'VERIFY') || str_contains($status, 'DOUBTFUL')) {
        $bs = 'doubtful';
    }
    
    $company = \App\Models\Company::where('symbol', $ticker)->first();
    if ($company) {
        $screening = \App\Models\AaoifiScreening::firstOrNew(['company_id' => $company->id]);
        $screening->business_status = $bs;
        $screening->business_reasoning = $reason;
        // Don't change other fields, just save
        $screening->save();
        $count++;
    }
}
echo "Imported business statuses for $count companies from Excel.\n";
