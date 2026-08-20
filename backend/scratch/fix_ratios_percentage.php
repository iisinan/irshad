<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AaoifiScreening;

$screenings = AaoifiScreening::all();
$updated = 0;

foreach ($screenings as $screening) {
    $changed = false;
    
    // Check if debt ratio was saved as a fraction instead of percentage
    if ($screening->debt_ratio !== null && $screening->debt_ratio <= 1.0 && $screening->debt_ratio > 0) {
        $screening->debt_ratio = $screening->debt_ratio * 100;
        $changed = true;
    }
    
    if ($screening->cash_ratio !== null && $screening->cash_ratio <= 1.0 && $screening->cash_ratio > 0) {
        $screening->cash_ratio = $screening->cash_ratio * 100;
        $changed = true;
    }
    
    if ($screening->impermissible_income_ratio !== null && $screening->impermissible_income_ratio <= 1.0 && $screening->impermissible_income_ratio > 0) {
        $screening->impermissible_income_ratio = $screening->impermissible_income_ratio * 100;
        $changed = true;
    }
    
    if ($changed) {
        $screening->save();
        $updated++;
    }
}

echo "Updated $updated screenings to percentage format.\n";

// Clear caches
\Illuminate\Support\Facades\Artisan::call('cache:clear');
echo "Caches cleared.\n";
