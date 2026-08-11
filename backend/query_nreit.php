<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = \App\Models\Company::where('symbol', 'NREIT')->with(['financials', 'aaoifiScreening'])->first();
if ($c) {
    echo json_encode($c->toArray(), JSON_PRETTY_PRINT);
} else {
    echo "Not found";
}
