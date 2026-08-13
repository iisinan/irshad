<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;
use Illuminate\Support\Facades\Http;

$json = file_get_contents('doubtful_raw_new.json');
$rationales = json_decode($json, true);

echo "Starting cleanup process for " . count($rationales) . " doubtful records...\n";

foreach ($rationales as $symbol => $rationale) {
    echo "Processing $symbol...\n";
    
    // Call Perplexity via Http facade
    $response = Http::withHeaders([
        'Authorization' => 'Bearer ' . env('PERPLEXITY_API_KEY'),
        'Content-Type' => 'application/json'
    ])->post('https://api.perplexity.ai/chat/completions', [
        'model' => 'sonar',
        'messages' => [
            ['role' => 'system', 'content' => 'You are a professional financial editor. Read the following rationale for a "Doubtful" stock\'s Shariah compliance. Break it into two distinct parts: 1) A short, direct, grammatically correct explanation of why it is doubtful (avoid long, wordy English). DO NOT include the "concerns with..." sentence in this part. 2) The EXACT sentence or phrase from the original text that expresses the concern (typically starts with or contains "Concerns with...", "raises concerns on...", or "concern."). Extract this verbatim from the text! Output ONLY these two parts separated by " ||| ", and absolutely nothing else. Do not use markdown asterisks. Example: "The company operates a hotel that may include impermissible bar revenue. ||| Concerns with segment and revenue source mix."'],
            ['role' => 'user', 'content' => $rationale]
        ]
    ]);

    if (!$response->successful()) {
        echo "Failed API for $symbol: " . $response->body() . "\n";
        continue;
    }

    $cleanedText = $response->json('choices.0.message.content');
    $cleanedText = trim($cleanedText);
    $cleanedText = str_replace('**', '', $cleanedText); // safety strip

    $company = Company::where('symbol', $symbol)->first();
    if ($company) {
        $company->activity_reason = $cleanedText;
        $company->save();

        $screening = AaoifiScreening::where('company_id', $company->id)->first();
        if ($screening) {
            $screening->business_reasoning = $cleanedText;
            $screening->save();
        }

        $status = StockStatus::where('company_id', $company->id)->first();
        if ($status) {
            $status->reason = $cleanedText;
            $status->save();
        }
        echo "Updated DB for $symbol\n";
    } else {
        echo "Company $symbol not found in DB\n";
    }
}
echo "Successfully updated rationale for " . count($rationales) . " doubtful companies.\n";
