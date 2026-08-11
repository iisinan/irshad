<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

app()->instance('verdict.unlock', true);

$excelData = json_decode(file_get_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/scratch/excel_data.json'), true);

$screenings = \App\Models\AaoifiScreening::with('company')->get();
$byTicker = [];
foreach ($screenings as $s) {
    if ($s->company) {
        $byTicker[$s->company->symbol] = $s;
    }
}

$count = 0;
foreach ($excelData as $row) {
    if (!isset($row['__EMPTY']) || !is_string($row['__EMPTY'])) continue;
    $parts = explode('—', $row['__EMPTY']);
    $ticker = trim($parts[0]);
    
    if (isset($byTicker[$ticker])) {
        $s = $byTicker[$ticker];
        
        $debt = isset($row['__EMPTY_1']) && is_numeric($row['__EMPTY_1']) ? (float)$row['__EMPTY_1'] : null;
        $cash = isset($row['__EMPTY_3']) && is_numeric($row['__EMPTY_3']) ? (float)$row['__EMPTY_3'] : null;
        $inc = isset($row['__EMPTY_5']) && is_numeric($row['__EMPTY_5']) ? (float)$row['__EMPTY_5'] : null;
        
        if ($debt !== null) $s->debt_ratio = $debt;
        if ($cash !== null) $s->cash_ratio = $cash;
        if ($inc !== null) $s->impermissible_income_ratio = $inc;
        
        $s->saveQuietly();
        $count++;
    }
}

// NREIT was manually calculated
if (isset($byTicker['NREIT'])) {
    $nreit = $byTicker['NREIT'];
    $nreit->debt_ratio = 0.0000;
    $nreit->cash_ratio = 0.059171;
    $nreit->impermissible_income_ratio = 0.0000;
    $nreit->saveQuietly();
}

echo "Restored {$count} records from excel_data.json\n";
