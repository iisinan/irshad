<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$symbol = \App\Models\Company::where('symbol', 'like', '%OKOMU%')->value('symbol');
echo "Found: " . ($symbol ?: "None") . "\n";
