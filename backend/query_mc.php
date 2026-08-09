<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$c = App\Models\Company::where('symbol', 'VITAFOAM')->first();
echo $c->market_cap . "\n";
echo $c->id . "\n";
