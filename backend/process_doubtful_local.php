<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;

$json = file_get_contents('doubtful_raw_new.json');
$rationales = json_decode($json, true);

echo "Starting LOCAL cleanup process for " . count($rationales) . " doubtful records...\n";

foreach ($rationales as $symbol => $rationale) {
    echo "Processing $symbol...\n";
    
    $tag = '';
    $mainText = $rationale;
    
    if (preg_match('/(Concerns with.*?|This is a disclosed.*?|raises concerns.*?|This raises concerns.*?|thus constituent weights raise concerns.*?|but concerns with regards.*?|so concerns are with regards.*?|concerns are with regards.*?)$/i', $rationale, $matches)) {
        $tag = trim($matches[1]);
        $mainText = trim(str_replace($matches[1], '', $rationale));
    } else {
        $tag = 'Requires Further Review';
    }
    
    // Clean up any trailing punctuation on main text before appending separator
    $mainText = rtrim($mainText, '. -');
    
    // Create the final string
    $finalText = $mainText . '. ||| ' . $tag;

    $company = Company::where('symbol', $symbol)->first();
    if ($company) {
        $company->activity_reason = $finalText;
        $company->save();

        $screening = AaoifiScreening::where('company_id', $company->id)->first();
        if ($screening) {
            $screening->business_reasoning = $finalText;
            $screening->save();
        }

        $status = StockStatus::where('company_id', $company->id)->first();
        if ($status) {
            $status->reason = $finalText;
            $status->save();
        }
        echo "Updated DB for $symbol\n";
    }
}
echo "Done!\n";
