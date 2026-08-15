<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use App\Models\StockStatus;

$doubtfuls = AaoifiScreening::where('final_status', 'doubtful')->orWhere('business_status', 'doubtful')->get();
$count = 0;

foreach ($doubtfuls as $d) {
    $company = Company::find($d->company_id);
    
    $raw = $d->business_reasoning;
    $text = '';
    if (is_array($raw)) {
        $text = $raw['summary'] ?? $raw['reasoning'] ?? '';
    } elseif (is_string($raw) && str_starts_with(trim($raw), '{')) {
        $decoded = json_decode($raw, true);
        $text = $decoded['summary'] ?? $decoded['reasoning'] ?? '';
    } else {
        $text = $raw;
    }
    
    if (empty($text)) continue;

    // Remove existing ||| if present so we can rebuild
    $parts = explode('|||', $text);
    $fullText = trim($parts[0]);
    
    // Default tag based on rephrasing
    $tag = 'Concerns with exact verification of operations.';

    if (preg_match('/(?:raising concerns about|present concerns regarding|raise concerns regarding|raising unresolved concerns about)\s+(.*)/i', $fullText, $matches)) {
        $tag = 'Concerns with ' . rtrim($matches[1], '. -');
    } elseif (str_contains(strtolower($fullText), 'require further verification')) {
        $tag = 'Concerns with the exact composition, constituent weights, and inclusion of companies from impermissible sectors.';
    } elseif (str_contains(strtolower($fullText), 'needs breakdown')) {
        $tag = 'Concerns with segment revenue mix needing breakdown.';
    } elseif (str_contains(strtolower($fullText), 'conventional lease financing')) {
        $tag = 'Concerns with conventional lease financing structures that may incorporate impermissible interest-based terms.';
    } elseif (str_contains(strtolower($fullText), 'strategic investments include')) {
        $tag = 'Concerns with strategic investments in platforms dedicated primarily to conventional, interest-based bond and money-market trading.';
    } elseif (str_contains(strtolower($fullText), 'production or distribution of alcohol')) {
        $tag = 'Concerns with the production or distribution of alcohol.';
    }

    // Special fix for NAHCO and HONYFLOUR if needed, but user said "leave it exactly like it is"
    
    // Capitalize first letter
    $tag = ucfirst($tag);

    $finalReasoning = $fullText . ' ||| ' . $tag;

    // Save to AaoifiScreening
    $d->business_reasoning = json_encode(['summary' => $finalReasoning]);
    $d->save();

    // Save to StockStatus
    $statusRecord = StockStatus::where('company_id', $company->id)->first();
    if ($statusRecord) {
        $statusRecord->reason = $finalReasoning;
        $statusRecord->save();
    }

    echo "{$company->symbol}:\n  Full Text: {$fullText}\n  Tag: {$tag}\n\n";
    $count++;
}

try {
    \Illuminate\Support\Facades\Artisan::call('cache:clear');
} catch (\Exception $e) {}

echo "Updated {$count} doubtful companies.\n";
