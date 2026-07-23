<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Bus;
use App\Jobs\ProcessCompanyScreening;
use App\Jobs\UpdateMarketData;

$ticker = 'ARADEL';
$jobs = [
    new ProcessCompanyScreening($ticker),
    new UpdateMarketData($ticker)
];

Bus::batch($jobs)->dispatch();
echo "Dispatched test jobs for {$ticker}\n";
