<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$jsonPath = "/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/scratch/non_halal_excel.json";
$excelData = json_decode(file_get_contents($jsonPath), true);
$mismatches = [];
$total = 0;

foreach($excelData as $ticker => $exReason) {
    $total++;
    $company = \App\Models\Company::where("symbol", $ticker)->first();
    if($company) {
        $status = \App\Models\StockStatus::where("company_id", $company->id)->first();
        if($status) {
            $dbReason = trim(str_replace(["\r", "\n", "\t", "  "], " ", $status->reason));
            $exReason = trim(str_replace(["\r", "\n", "\t", "  "], " ", $exReason));
            if($dbReason != $exReason && strcasecmp($dbReason, $exReason) !== 0) {
                $dbReasonNorm = preg_replace("/\s+/", " ", $dbReason);
                $exReasonNorm = preg_replace("/\s+/", " ", $exReason);
                if ($dbReasonNorm != $exReasonNorm) {
                    $mismatches[$ticker] = ["db" => $dbReasonNorm, "excel" => $exReasonNorm];
                }
            }
        } else {
            echo "No status for $ticker\n";
        }
    } else {
        echo "No company found for $ticker\n";
    }
}

if(count($mismatches) == 0) {
    echo "Checked $total stocks. ALL rationales match PERFECTLY!\n";
} else {
    echo "Found " . count($mismatches) . " mismatches out of $total stocks:\n";
    foreach($mismatches as $t => $data) {
        echo "- $t\n  DB: {$data["db"]}\n  Excel: {$data["excel"]}\n\n";
    }
}
