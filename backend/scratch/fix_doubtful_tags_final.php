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

    // Drop the existing tag if any
    $parts = explode('|||', $text);
    $fullText = trim($parts[0]);
    
    // Extract last sentence
    $sentences = preg_split('/(?<=[.?!])\s+(?=[a-zA-Z])/i', $fullText);
    $lastSentence = trim(end($sentences));
    
    $tag = $lastSentence;
    
    // If it doesn't start with "concerns with", try to rephrase it.
    if (!preg_match('/^concerns\s+with/i', $tag)) {
        if (preg_match('/(?:there are concerns regarding|concerns regarding|raising concerns regarding|raising significant concerns regarding|raising compliance concerns regarding|raising regulatory and compliance concerns regarding|raising underlying compliance concerns regarding|creates a mixed-client vendor profile with unconfirmed revenue exposure to|creating concerns regarding)\s+(.*)/i', $tag, $matches)) {
            $tag = 'Concerns with ' . rtrim($matches[1], '.');
        } elseif (preg_match('/it remains doubtful pending a precise compliance verdict on\s+(.*)/i', $tag, $matches)) {
            $tag = 'Concerns with ' . rtrim($matches[1], '.');
        } elseif (preg_match('/revenue mix needs breakdown/i', $tag)) {
            $tag = 'Concerns with segment revenue mix needing breakdown';
        } elseif (preg_match('/needs verification/i', $tag)) {
            $tag = 'Concerns with verifying specific sources of revenue';
        } elseif (preg_match('/the product itself.*however, named major customers explicitly include.*raising significant concerns regarding (.*)/i', $fullText, $matches)) {
            $tag = 'Concerns with ' . rtrim($matches[1], '.');
        } elseif (preg_match('/(production or distribution of alcohol)/i', $tag, $matches)) {
            $tag = 'Concerns with the ' . $matches[1];
        } else {
            // fallback generic if absolutely no match
            $tag = 'Concerns with ' . lcfirst($tag);
        }
    }
    
    // Ensure it ends with a period and starts with capital
    $tag = rtrim($tag, '.') . '.';
    $tag = ucfirst($tag);
    
    // Hardcode overrides if the regex failed for some specific ones
    if ($company->symbol === 'AFROMEDIA') {
        $tag = "Concerns with the company's client mix, particularly the proportion of advertising revenue derived from alcohol and betting promotions.";
    } elseif ($company->symbol === 'NAHCO') {
        $tag = "Concerns with the production or distribution of alcohol.";
    } elseif ($company->symbol === 'BETAGLAS') {
        $tag = "Concerns with its primary revenue sources, particularly breweries and spirits producers.";
    } elseif ($company->symbol === 'NCR') {
        $tag = "Concerns with unconfirmed revenue exposure to the gaming and betting sectors.";
    } elseif ($company->symbol === 'TANTALIZER') {
        $tag = "Concerns with the revenue mix from its live-game platform.";
    }

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

    echo "{$company->symbol}:\n  Tag: {$tag}\n";
    $count++;
}

\Illuminate\Support\Facades\Artisan::call('cache:clear');
echo "Updated {$count} doubtful companies.\n";
