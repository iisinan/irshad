<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$companies = App\Models\Company::where('current_status', 'doubtful')->with('status')->get();
foreach ($companies as $c) {
    echo "{$c->symbol}:\n";
    echo "Reason: " . ($c->status ? $c->status->reason : 'N/A') . "\n";
    echo "---\n";
}
