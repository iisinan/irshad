<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = App\Models\Company::where('symbol', 'CMFC')->first();
if (!$c) {
    echo "CMFC not found.\n";
    exit;
}
$s = App\Models\StockStatus::where('company_id', $c->id)->first();
echo "Status: {$s->status}\nReason: {$s->reason}\n";
