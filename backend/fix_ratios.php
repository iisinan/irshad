<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

app()->instance('verdict.unlock', true);

$screenings = \App\Models\AaoifiScreening::all();

$fixed = 0;
$skipped = 0;

echo "Checking " . $screenings->count() . " records..." . PHP_EOL . PHP_EOL;

foreach ($screenings as $s) {
    $company = $s->company;
    $symbol  = $company ? $company->symbol : "id:{$s->company_id}";

    $changed = false;
    $log = [];

    // Fix each field independently — only multiply if it's stored as a decimal (< 1)
    $debt = (float) $s->debt_ratio;
    if ($debt > 0 && $debt < 1) {
        $new = round($debt * 100, 4);
        $log[] = "debt {$debt} → {$new}%";
        $s->debt_ratio = $new;
        $changed = true;
    }

    $cash = (float) $s->cash_ratio;
    if ($cash > 0 && $cash < 1) {
        $new = round($cash * 100, 4);
        $log[] = "cash {$cash} → {$new}%";
        $s->cash_ratio = $new;
        $changed = true;
    }

    $inc = (float) $s->impermissible_income_ratio;
    if ($inc > 0 && $inc < 1) {
        $new = round($inc * 100, 4);
        $log[] = "inc {$inc} → {$new}%";
        $s->impermissible_income_ratio = $new;
        $changed = true;
    }

    if ($changed) {
        try {
            $s->saveQuietly();
            echo "✅ {$symbol}: " . implode('  |  ', $log) . PHP_EOL;
            $fixed++;
        } catch (\Exception $e) {
            echo "❌ {$symbol}: FAILED — " . $e->getMessage() . PHP_EOL;
        }
    } else {
        $skipped++;
    }
}

echo PHP_EOL . "Done. Fixed: {$fixed} | Skipped (already correct): {$skipped}" . PHP_EOL;
