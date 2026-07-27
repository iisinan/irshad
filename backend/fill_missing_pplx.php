<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;
use App\Models\Company;

$companies = Company::all();
$missing = [];
foreach ($companies as $c) {
    if (empty($c->industry) || strtolower($c->industry) === 'unknown' || strtolower($c->industry) === 'n/a' || empty($c->sector) || strtolower($c->sector) === 'unknown' || strtolower($c->sector) === 'n/a' || (empty($c->description) && empty($c->overview))) {
        $missing[] = $c;
    }
}

$apiKey = str_replace('"', '', env('PERPLEXITY_API_KEY'));

foreach ($missing as $c) {
    echo "Processing {$c->symbol} - {$c->name}\n";
    $prompt = "You are a financial data assistant. Look up the Nigerian stock: {$c->symbol} ({$c->name}). Provide the exact 'Industry', 'Sector', and a brief 'Overview' (1-2 sentences). Return ONLY a JSON object with keys: industry, sector, overview. Do not include markdown formatting or backticks. Example: {\"industry\": \"Banking\", \"sector\": \"Financial Services\", \"overview\": \"A leading bank in Nigeria.\"} If you don't know, provide your best guess for the Nigerian market.";
    
    $response = Http::withHeaders([
        'Authorization' => "Bearer {$apiKey}",
        'Content-Type' => 'application/json',
    ])->timeout(30)->post("https://api.perplexity.ai/chat/completions", [
        'model' => 'sonar',
        'messages' => [
            ['role' => 'system', 'content' => 'You are a helpful assistant.'],
            ['role' => 'user', 'content' => $prompt]
        ]
    ]);
    
    if ($response->successful()) {
        $jsonStr = $response->json('choices.0.message.content');
        if ($jsonStr) {
            $jsonStr = trim($jsonStr);
            if (strpos($jsonStr, '```json') === 0) {
                $jsonStr = substr($jsonStr, 7, -3);
            }
            if (strpos($jsonStr, '```') === 0) {
                $jsonStr = substr($jsonStr, 3, -3);
            }
            $data = json_decode(trim($jsonStr), true);
            if ($data) {
                if (empty($c->industry) || strtolower($c->industry) === 'unknown' || strtolower($c->industry) === 'n/a') {
                    $c->industry = $data['industry'] ?? 'Unknown';
                }
                if (empty($c->sector) || strtolower($c->sector) === 'unknown' || strtolower($c->sector) === 'n/a') {
                    $c->sector = $data['sector'] ?? 'Unknown';
                }
                if (empty($c->description) && empty($c->overview)) {
                    $c->overview = $data['overview'] ?? '';
                    $c->description = $data['overview'] ?? '';
                }
                $c->save();
                echo "Updated {$c->symbol}: Industry={$c->industry}, Sector={$c->sector}\n";
            } else {
                echo "Failed to parse JSON for {$c->symbol}: $jsonStr\n";
            }
        }
    } else {
        echo "API failed for {$c->symbol}: " . $response->body() . "\n";
    }
    sleep(1); // rate limiting for perplexity
}
echo "Done!\n";
