<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$companies = \App\Models\Company::whereHas('aaoifiScreening', function($q) {
    $q->where('business_status', 'halal');
})->with('aaoifiScreening')->get();

foreach ($companies as $c) {
    echo "Fixing " . $c->symbol . "...\n";
    $c->aaoifiScreening->business_status = 'pass';
    $c->aaoifiScreening->save();
}
echo "Done.\n";
