<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = [
    'compliance_reviews',
    'compliance_status_changes',
    'compliance_histories',
    'financial_review_queue',
    'admin_alerts',
    'user_notifications',
];

foreach ($tables as $table) {
    try {
        DB::table($table)->delete();
        echo "Cleared $table.\n";
    } catch (\Exception $e) {
        echo "Error clearing $table: " . $e->getMessage() . "\n";
    }
}
