<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$c = Company::where('symbol', 'DAARCOMM')->with('aaoifiScreening')->first();
echo json_encode($c->aaoifiScreening->toArray(), JSON_PRETTY_PRINT);
