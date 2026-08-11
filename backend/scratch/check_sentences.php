<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$fails = App\Models\AaoifiScreening::where('business_status', 'fail')->get();
$issues = [];
foreach ($fails as $f) {
    $reason = $f->business_reasoning;
    if (is_array($reason)) {
        $text = $reason['justification'] ?? $reason['reason'] ?? $reason['reasoning'] ?? $reason['evidence'] ?? json_encode($reason);
    } elseif (is_string($reason)) {
        $decoded = json_decode($reason, true);
        if (is_array($decoded) && (isset($decoded['justification']) || isset($decoded['reason']) || isset($decoded['reasoning']))) {
            $text = $decoded['justification'] ?? $decoded['reason'] ?? $decoded['reasoning'];
        } else {
            $text = $reason;
        }
    } else {
        $text = (string) $reason;
    }
    
    $text = trim($text);
    // clean up any abbreviations like "e.g.", "i.e.", "Inc." so they don't count as sentence boundaries
    $text = str_replace(['e.g.', 'i.e.', 'Inc.', 'Ltd.', 'Plc.'], ['eg', 'ie', 'Inc', 'Ltd', 'Plc'], $text);
    
    // Check if it has multiple sentences
    $sentences = preg_split('/(?<=[.?!])\s+(?=[a-zA-Z])/', $text);
    
    // Some reasons might just be a phrase without a period, we count that as 1.
    if (count($sentences) > 1) {
        $issues[] = [
            'symbol' => $f->company->symbol,
            'reasoning' => $text,
            'sentences_count' => count($sentences)
        ];
    }
}
echo json_encode($issues, JSON_PRETTY_PRINT);
