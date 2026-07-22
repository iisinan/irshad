<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use Illuminate\Support\Facades\Http;

$htmlResponse = Http::withHeaders([
    'Referer' => 'https://ngxpulse.ng/',
    'User-Agent' => 'Mozilla/5.0'
])->timeout(30)->get('https://ngxpulse.ng/');

$logoMapping = [];
if ($htmlResponse->successful()) {
    if (preg_match('/let logoMapping=(\{.*?\});/', $htmlResponse->body(), $matches)) {
        $logoMapping = json_decode($matches[1], true) ?? [];
    }
}

echo "Found " . count($logoMapping) . " logos in mapping.\n";

$companies = Company::all();
$updated = 0;
foreach ($companies as $company) {
    if (isset($logoMapping[$company->symbol])) {
        $logoUrl = "https://ngxpulse.ng/logos_small/" . $logoMapping[$company->symbol];
        if ($company->logo_url !== $logoUrl) {
            $company->logo_url = $logoUrl;
            $company->save();
            $updated++;
        }
    } else {
        if ($company->logo_url !== null) {
            $company->logo_url = null;
            $company->save();
            $updated++;
        }
    }
}

echo "Updated $updated company logos.\n";
