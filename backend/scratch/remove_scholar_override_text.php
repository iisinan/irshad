<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$statuses = \App\Models\StockStatus::where('reason', 'LIKE', '%Scholar Override:%')->get();

$count = 0;
foreach ($statuses as $status) {
    $newReason = trim(str_replace('Scholar Override:', '', $status->reason));
    $status->reason = $newReason;
    $status->save();
    $count++;
    echo "Updated {$status->company_id}: {$newReason}\n";
}

echo "\nSuccessfully removed 'Scholar Override:' from {$count} records.\n";
