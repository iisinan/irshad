<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$fails = App\Models\AaoifiScreening::where('business_status', 'fail')
    ->join('companies', 'aaoifi_screenings.company_id', '=', 'companies.id')
    ->orderBy('companies.symbol')
    ->select('companies.symbol', 'aaoifi_screenings.business_reasoning')
    ->get();

$md = "# Shariah Business Activity Screening - Failure Justifications\n\n";
$md .= "This document lists the 64 stocks that failed the Qualitative Business Activity screening, along with their exact one-sentence justification currently stored in the database.\n\n";
$md .= "| Symbol | Justification |\n";
$md .= "|---|---|\n";

foreach ($fails as $f) {
    $r = $f->business_reasoning;
    $text = is_string($r) ? (json_decode($r, true)['justification'] ?? $r) : ($r['justification'] ?? '');
    // clean up any newlines just in case
    $text = str_replace(["\r", "\n"], " ", $text);
    $md .= "| **{$f->symbol}** | {$text} |\n";
}

file_put_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/failed_business_justifications.md', $md);
echo "Artifact created.";
