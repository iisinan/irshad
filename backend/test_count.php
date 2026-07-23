<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$count = \App\Models\Company::where('is_active', true)->count();
echo "Active Companies: " . $count . "\n";

$jobs = \Illuminate\Support\Facades\DB::table('jobs')->count();
echo "Jobs: " . $jobs . "\n";

$failed_jobs = \Illuminate\Support\Facades\DB::table('failed_jobs')->count();
echo "Failed Jobs: " . $failed_jobs . "\n";
