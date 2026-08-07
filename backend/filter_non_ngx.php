<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$results = [];
$companies = \App\Models\Company::all();

foreach ($companies as $company) {
    $financial = \App\Models\Financial::where('company_id', $company->id)->latest()->first();
    $financialSource = $financial ? $financial->source_url : null;
    
    $aaoifi = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    $aaoifiSource = null;
    if ($aaoifi && is_array($aaoifi->financial_data_used)) {
        $aaoifiSource = $aaoifi->financial_data_used['source_url'] ?? null;
    }
    
    $sources = array_unique(array_filter([$financialSource, $aaoifiSource]));
    
    if (empty($sources)) {
        $results[] = [
            'symbol' => $company->symbol,
            'name' => $company->name,
            'status' => 'No Financial Statement Attached (Source URL Missing)'
        ];
        continue;
    }
    
    foreach ($sources as $src) {
        $isNgx = (stripos($src, 'ngxgroup.com') !== false || stripos($src, 'ngxpulse') !== false || stripos($src, 'doclib') !== false);
        if (!$isNgx) {
            $results[] = [
                'symbol' => $company->symbol,
                'name' => $company->name,
                'status' => 'External / Non-NGX Source',
                'url' => $src
            ];
        }
    }
}

echo json_encode($results, JSON_PRETTY_PRINT);
