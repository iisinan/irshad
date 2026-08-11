<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$notActive = \App\Models\Company::where('is_active', false)->pluck('symbol')->toArray();
echo "Not Active: " . implode(', ', $notActive) . "\n";
