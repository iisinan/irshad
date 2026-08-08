<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$m = App\Models\MarketData::where('ticker', 'ARADEL')->first()->toArray();
print_r(array_intersect_key($m, array_flip(['market_cap', 'shares_outstanding', 'volume', 'pe_ratio', 'eps'])));
