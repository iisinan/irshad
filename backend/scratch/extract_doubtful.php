<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;
use App\Models\Company;

$symbols = [
    'AFROMEDIA',
    'BETAGLAS',
    'CILEASING',
    'DAARCOMM',
    'HMCALL',
    'NCR',
    'NGXGROUP',
    'SFSREIT',
    'TANTALIZER',
    'TRANSCORP',
    'UHOMREIT',
    'UPDCREIT',
    'NEWGOLD',
    'VETGOODS',
    'VETINDETF',
    'MERGROWTH',
    'MERVALUE'
];

$results = [];

foreach ($symbols as $symbol) {
    $company = Company::where('symbol', $symbol)->first();
    if ($company) {
        $screening = AaoifiScreening::where('company_id', $company->id)->first();
        if ($screening) {
            $reason = is_string($screening->business_reasoning) ? json_decode($screening->business_reasoning, true) : $screening->business_reasoning;
            $summary = $reason['summary'] ?? '';
            $results[$symbol] = [
                'business_status' => $screening->business_status,
                'original' => $summary
            ];
        }
    }
}

file_put_contents('/Users/sinan/Herd/irshad/backend/scratch/doubtful_rationales.json', json_encode($results, JSON_PRETTY_PRINT));
echo "Extracted rationales for " . count($results) . " companies.\n";
