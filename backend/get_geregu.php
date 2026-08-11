<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$c = \App\Models\Company::where('symbol', 'GEREGU')->first();
if ($c) echo "Market Cap: " . $c->market_cap . "\n";
