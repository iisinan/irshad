<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$count = App\Models\StockStatus::where('reason', 'Manual classification.')->count();
echo "Count: {$count}\n";

$stocks = App\Models\StockStatus::where('reason', 'Manual classification.')->with('company')->get();
foreach ($stocks as $s) {
    if ($s->company) {
        echo "- " . $s->company->symbol . "\n";
    }
}
