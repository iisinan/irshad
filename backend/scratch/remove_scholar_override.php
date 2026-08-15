<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\StockStatus;

$statuses = StockStatus::all();
$updated = 0;

foreach ($statuses as $status) {
    if (!$status->reason) continue;
    
    $reason = $status->reason;
    $original = $reason;
    
    // Remove variations of "Scholar Override: " at the beginning
    $reason = preg_replace('/^scholar override[:\-\s]*/i', '', $reason);
    
    // Remove variations of "per scholar override" at the end
    $reason = preg_replace('/(?:per|by|due to)?\s*scholar override\.?$/i', '.', $reason);
    
    // Sometimes it's just "Scholar Override" exactly
    if (trim(strtolower($reason)) === 'scholar override' || trim(strtolower($reason)) === 'scholar override.') {
        $reason = 'Manual classification.';
    }
    
    // Fix punctuation if necessary
    $reason = str_replace('..', '.', $reason);
    $reason = trim($reason);
    
    // Capitalize first letter
    if (strlen($reason) > 0) {
        $reason[0] = strtoupper($reason[0]);
    }
    
    if ($reason !== $original) {
        $status->reason = $reason;
        $status->save();
        $updated++;
    }
}

echo "Cleaned up 'scholar override' from $updated StockStatus records.\n";
