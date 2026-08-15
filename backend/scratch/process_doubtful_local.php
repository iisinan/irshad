<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

$json = file_get_contents(__DIR__.'/../doubtful_raw_new.json');
$rationales = json_decode($json, true);

echo "Starting LOCAL cleanup process for " . count($rationales) . " doubtful records...\n";

foreach ($rationales as $symbol => $rationale) {
    echo "Processing $symbol...\n";
    
    $tag = '';
    $mainText = $rationale;
    
    // Match the last sentence that indicates a concern
    if (preg_match('/(Concerns with.*?|This is a disclosed.*?|raises concerns.*?|This raises concerns.*?|thus constituent weights raise concerns.*?|but concerns with regards.*?|so concerns are with regards.*?|concerns are with regards.*?)$/i', $rationale, $matches)) {
        $tag = trim($matches[1]);
        $mainText = trim(str_replace($matches[1], '', $rationale));
    } else {
        // Fallback if no match, just use Requires Further Review
        $tag = 'Requires Further Review';
    }
    
    // Clean up any trailing punctuation on main text before appending separator
    $mainText = rtrim($mainText, '. -');
    
    // Create the final string
    $finalText = $mainText . '. ||| ' . $tag;

    $company = Company::where('symbol', $symbol)->first();
    if ($company) {
        $company->activity_reason = $finalText;
        $company->current_status = 'doubtful';
        $company->save();

        $screening = AaoifiScreening::where('company_id', $company->id)->first();
        if ($screening) {
            $screening->business_reasoning = json_encode(['summary' => $finalText]);
            $screening->final_status = 'doubtful';
            $screening->save();
        }

        echo "  -> Applied Tag: $tag\n";
    }
}
echo "Done.\n";
