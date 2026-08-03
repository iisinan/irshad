<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$fallback = app(\App\Services\NgxPulseFallbackService::class);
$url = $fallback->findLatestFinancialPdfUrl('AIRTELAFRI');
echo "Apify Result: " . ($url ? $url : "NOT FOUND") . "\n";
