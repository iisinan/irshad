<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$c = \App\Models\Company::where('symbol', 'BAPLC')->with('aaoifiScreening')->first();
echo "Activity Reason: " . $c->activity_reason . "\n";
echo "Overview: " . $c->overview . "\n";
if ($c->aaoifiScreening) {
    echo "AAOIFI Business Reasoning: " . json_encode($c->aaoifiScreening->business_reasoning) . "\n";
}
