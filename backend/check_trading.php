<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$first = \App\Models\Company::first();
echo json_encode(array_keys($first->toArray())) . "\n";
