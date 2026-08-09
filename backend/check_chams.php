<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$comp = \App\Models\Company::where('symbol', 'CHAMS')->first();
$scr = \App\Models\AaoifiScreening::where('company_id', $comp->id)->first();
echo "Symbol: " . $comp->symbol . "\n";
echo "stage1: " . json_encode($scr->stage1) . "\n";
echo "business_status: " . $scr->business_status . "\n";
echo "business_reasoning: " . json_encode($scr->business_reasoning) . "\n";
echo "final_status: " . $scr->final_status . "\n";
