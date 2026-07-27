<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\StockStatus;

$statuses = StockStatus::all();

$unwantedPhrases = [];
foreach ($statuses as $status) {
    if ($status->reason) {
        $reason = $status->reason;
        if (str_contains($reason, 'Financial ratio screening pending')) {
            echo "Match found for {$status->company_id}: $reason\n";
        }
    }
}
