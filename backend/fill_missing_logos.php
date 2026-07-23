<?php
/**
 * fill_missing_logos.php
 * For companies still missing logos after Yahoo Finance fetch:
 * 1. Try Clearbit logo API (logo.clearbit.com)
 * 2. Fall back to a UI Avatar (initials-based SVG URL)
 * Run: php fill_missing_logos.php
 */
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use Illuminate\Support\Facades\Http;

$companies = Company::whereNull('logo_url')->orWhere('logo_url', '')->get();
echo "Companies still missing logos: " . $companies->count() . "\n";

$clearbitHits = 0;
$avatarHits   = 0;

foreach ($companies as $company) {
    $name   = $company->name;
    $symbol = $company->symbol;

    // Strategy 1: Try Clearbit with common domain patterns
    $domainCandidates = [
        strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $symbol)) . '.com',
        strtolower(preg_replace('/\s+(plc|ltd|limited|group|ng)$/i', '', $name)) . '.com',
    ];
    $clearbitFound = false;
    foreach ($domainCandidates as $domain) {
        $clearbitUrl = "https://logo.clearbit.com/{$domain}";
        try {
            $res = Http::timeout(5)->head($clearbitUrl);
            if ($res->successful() && str_contains($res->header('Content-Type') ?? '', 'image')) {
                $company->logo_url = $clearbitUrl;
                $company->save();
                echo "  [CLEARBIT] $symbol → $clearbitUrl\n";
                $clearbitFound = true;
                $clearbitHits++;
                break;
            }
        } catch (\Exception $e) {
            // continue to next candidate
        }
    }

    if ($clearbitFound) continue;

    // Strategy 2: UI Avatar — initials-based colourful avatar
    // Use a deterministic colour based on the symbol
    $colors = ['0D47A1', '1B5E20', '4A148C', 'B71C1C', 'E65100', '006064', '37474F', '880E4F'];
    $colorIdx = abs(crc32($symbol)) % count($colors);
    $bg = $colors[$colorIdx];
    $initials = substr($symbol, 0, 2);
    $avatarUrl = "https://ui-avatars.com/api/?name={$initials}&background={$bg}&color=fff&bold=true&size=128&format=svg";
    $company->logo_url = $avatarUrl;
    $company->save();
    echo "  [AVATAR]   $symbol → $avatarUrl\n";
    $avatarHits++;
}

echo "\n✅ Done!\n";
echo "  Clearbit logos found: $clearbitHits\n";
echo "  Avatar fallbacks:     $avatarHits\n";
