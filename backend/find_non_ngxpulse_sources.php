<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$companies = \App\Models\Company::all();
$results = [];

foreach ($companies as $company) {
    // 1. Check Financial model
    $financial = \App\Models\Financial::where('company_id', $company->id)->latest()->first();
    $financialSource = $financial ? $financial->source_url : null;
    
    // 2. Check AaoifiScreening financial_data_used
    $aaoifi = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    $aaoifiSource = null;
    if ($aaoifi && is_array($aaoifi->financial_data_used)) {
        $aaoifiSource = $aaoifi->financial_data_used['source_url'] ?? null;
    }
    
    // Combine sources
    $sources = array_filter([$financialSource, $aaoifiSource]);
    
    if (empty($sources)) {
        $results[] = [
            'symbol' => $company->symbol,
            'name' => $company->name,
            'source' => 'None / Empty',
            'is_ngxpulse' => false
        ];
        continue;
    }
    
    $isNgxPulse = false;
    $foundSource = '';
    foreach ($sources as $src) {
        $foundSource = $src;
        if (stripos($src, 'ngxpulse') !== false || stripos($src, 'doclib.ngxgroup.com') !== false || stripos($src, 'ngxgroup.com') !== false) {
            $isNgxPulse = true;
            break;
        }
    }
    
    if (!$isNgxPulse) {
        $results[] = [
            'symbol' => $company->symbol,
            'name' => $company->name,
            'source' => $foundSource,
            'is_ngxpulse' => false
        ];
    }
}

echo json_encode($results, JSON_PRETTY_PRINT);
