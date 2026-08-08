<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$c = App\Models\Company::where('symbol', 'ARADEL')->first()->toArray();
print_r(array_intersect_key($c, array_flip(['market_cap', 'shares_outstanding', 'volume_today', 'pe_ratio', 'eps'])));
