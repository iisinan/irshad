<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$fin = \App\Models\Financial::first();
if ($fin) {
    echo json_encode($fin->toArray(), JSON_PRETTY_PRINT);
} else {
    echo "No financial data found.";
}
