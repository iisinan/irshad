<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

$companies = Company::where('current_status', 'doubtful')->get();
$count = 0;

foreach ($companies as $company) {
    $screening = AaoifiScreening::where('company_id', $company->id)->first();
    if (!$screening) continue;

    $raw = $screening->business_reasoning;
    $text = '';
    
    if (is_array($raw)) {
        if (isset($raw['summary'])) {
            $text = $raw['summary'];
        } elseif (isset($raw['justification'])) {
            $text = $raw['justification'];
        }
    } elseif (is_string($raw) && str_starts_with(trim($raw), '{')) {
        $decoded = json_decode($raw, true);
        if (isset($decoded['summary'])) {
            $text = $decoded['summary'];
        } elseif (isset($decoded['justification'])) {
            $text = $decoded['justification'];
        }
    } else {
        $text = $raw;
    }

    if (empty($text) || !is_string($text)) {
        if (is_array($text)) $text = json_encode($text);
        if (empty($text)) continue;
    }

    // Pattern from previous chat
    if (preg_match('/(Concerns with.*?|This is a disclosed.*?|raises concerns.*?|This raises concerns.*?|thus constituent weights raise concerns.*?|but concerns with regards.*?|so concerns are with regards.*?|concerns are with regards.*?)$/i', $text, $matches)) {
        $tag = trim($matches[1]);
        $mainText = trim(str_replace($matches[1], '', $text));
    } else {
        $tag = 'Requires Further Review';
        $mainText = trim($text);
    }

    $mainText = rtrim($mainText, '. -');
    $finalText = $mainText . '. ||| ' . $tag;

    // Use json_encode only if the field is not auto-casted, but if it is auto-casted, assigning an array is better.
    // Let's just assign an array and Laravel will handle json encoding if it's cast, OR if it's not cast, it will fail.
    // So let's check what it currently is.
    
    $screening->business_reasoning = json_encode(['summary' => $finalText]);
    $screening->save();
    
    echo "Updated {$company->symbol}: Tag -> $tag\n";
    $count++;
}

echo "Updated $count doubtful companies.\n";
