<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$screenings = App\Models\AaoifiScreening::all();
$count = 0;
foreach ($screenings as $aaoifi) {
    $updated = false;
    if ($aaoifi->debt_ratio > 0 && $aaoifi->debt_ratio <= 1.0) {
        $aaoifi->debt_ratio = $aaoifi->debt_ratio * 100;
        $updated = true;
    }
    if ($aaoifi->cash_ratio > 0 && $aaoifi->cash_ratio <= 1.0) {
        $aaoifi->cash_ratio = $aaoifi->cash_ratio * 100;
        $updated = true;
    }
    // Most impermissible_income_ratio are already > 1 (e.g. 1.88), but if any are decimals like 0.04
    if ($aaoifi->impermissible_income_ratio > 0 && $aaoifi->impermissible_income_ratio <= 0.5) {
        // Only multiply if it is likely a decimal fraction (< 0.5 = < 50%)
        $aaoifi->impermissible_income_ratio = $aaoifi->impermissible_income_ratio * 100;
        $updated = true;
    }
    if ($updated) {
        $aaoifi->save();
        $count++;
    }
}
echo "Fixed ratios for $count companies globally!\n";
