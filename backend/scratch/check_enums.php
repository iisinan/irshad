<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$statuses = \App\Models\StockStatus::select('status')->distinct()->get();
echo "Current statuses in table:\n";
foreach ($statuses as $s) {
    echo "- " . $s->status . "\n";
}
