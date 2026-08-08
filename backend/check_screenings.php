<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$jsonPath = "/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/scratch/non_halal_excel.json";
$excelData = json_decode(file_get_contents($jsonPath), true);
$tickers = array_keys($excelData);

$companies = \App\Models\Company::whereIn('symbol', $tickers)->get()->keyBy('id');
$screenings = \App\Models\AaoifiScreening::whereIn('company_id', $companies->keys())->get()->keyBy('company_id');

foreach($companies as $id => $comp) {
    if(isset($screenings[$id])) {
        $scr = $screenings[$id];
        echo "{$comp->symbol}: bs={$scr->business_status}, br={$scr->business_reasoning}\n";
    }
}
