<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;
use Illuminate\Support\Facades\Http;

$jsonFile = __DIR__.'/raw_rationales.json';
if (!file_exists($jsonFile)) {
    echo "JSON file not found!\n";
    exit(1);
}

$data = json_decode(file_get_contents($jsonFile), true);
$apiKey = env('GEMINI_API_KEY');

if (!$apiKey) {
    echo "GEMINI_API_KEY not found in .env\n";
    exit(1);
}

$updatedCount = 0;
echo "Starting cleanup process for " . count($data) . " records...\n";

foreach ($data as $symbol => $rationale) {
    echo "Processing {$symbol}...\n";
    
    $apiKey = env('PERPLEXITY_API_KEY');
    if (!$apiKey) {
        echo "PERPLEXITY_API_KEY not found in .env\n";
        exit(1);
    }
    
    $success = false;
    $retries = 3;
    $cleanedText = '';
    
    while (!$success && $retries > 0) {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json'
        ])->post('https://api.perplexity.ai/chat/completions', [
            'model' => 'sonar',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a professional financial editor. Summarize the following justification for why a stock failed a Shariah compliance screen into EXACTLY ONE single sentence. IMPORTANT RULES: 1) Do NOT start with "It failed because" or "This stock failed due to". 2) If the company is a bank or financial institution, explicitly state the direct reason and you MUST include the word "Riba". 3) For companies that are NOT banking or finance related (like agriculture, manufacturing, etc.), JUST state the non-compliant activities they engage in based on the text (e.g. "The company engages in swine farming and piggery."). Do not include background context, investigations, or disclaimers. Remove any typographical errors, fix grammar, and remove unwanted or weird punctuation. Output ONLY the one-sentence summary, without quotes or conversational filler.'],
                ['role' => 'user', 'content' => $rationale]
            ]
        ]);

        if ($response->status() === 429) {
            echo "Rate limited (429). Waiting 20 seconds...\n";
            sleep(20);
            $retries--;
            continue;
        }
        
        if (!$response->successful()) {
            echo "Failed to call Perplexity API for {$symbol}: " . $response->body() . "\n";
            break;
        }
        
        $resData = $response->json();
        $cleanedText = $resData['choices'][0]['message']['content'] ?? '';
        $cleanedText = trim($cleanedText);
        $success = true;
    }
    
    if (!$success || empty($cleanedText)) {
        echo "Empty or failed response for {$symbol}\n";
        continue;
    }
    
    $company = Company::where('symbol', $symbol)->first();
    if ($company) {
        // Update company
        $cleanedText = str_replace('**', '', $cleanedText);
        $company->activity_reason = $cleanedText;
        $company->save();

        // Update AaoifiScreening
        $screening = AaoifiScreening::where('company_id', $company->id)->first();
        if ($screening) {
            $screening->business_reasoning = $cleanedText;
            $screening->save();
        }

        // Update StockStatus
        $status = StockStatus::where('company_id', $company->id)->first();
        if ($status) {
            $status->reason = $cleanedText;
            $status->save();
        }

        $updatedCount++;
        echo "Updated DB for {$symbol}\n";
    } else {
        echo "Company {$symbol} not found in DB\n";
    }
    
    // Sleep briefly to respect rate limits
    usleep(500000); // 0.5 seconds
}

echo "Successfully cleaned and updated rationale for {$updatedCount} failed companies.\n";
