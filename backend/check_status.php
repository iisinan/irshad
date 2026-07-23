<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$jobs = DB::table('jobs')->count();
$failedJobs = DB::table('failed_jobs')->count();
$financialScreenings = DB::table('financial_screenings')->count();
$businessScreenings = DB::table('business_screenings')->count();

echo "Jobs Pending: $jobs\n";
echo "Jobs Failed: $failedJobs\n";
echo "Financial Screenings Completed: $financialScreenings\n";
echo "Business Screenings Completed: $businessScreenings\n";
