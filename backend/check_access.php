<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$comp = \App\Models\Company::where('name', 'like', '%Access Holdings%')->first();
$scr = \App\Models\AaoifiScreening::where('company_id', $comp->id)->first();
echo "Symbol: " . $comp->symbol . "\n";
echo "stage1: " . json_encode($scr->stage1) . "\n";
echo "business_reasoning: " . json_encode($scr->business_reasoning) . "\n";
echo "status_reason: " . json_encode($scr->status_reason) . "\n";
