<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$companies = App\Models\Company::where('current_status', 'doubtful')->get();
if ($companies->isEmpty()) {
    echo "No doubtful stocks found in the 'companies' table.\n";
} else {
    foreach ($companies as $c) {
        echo "- {$c->name} ({$c->symbol})\n";
    }
}
