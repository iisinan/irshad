<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$c = \App\Models\Company::with(['status', 'aaoifiScreening'])->where('symbol', 'JOHNHOLT')->first();
echo json_encode($c->toArray(), JSON_PRETTY_PRINT);
