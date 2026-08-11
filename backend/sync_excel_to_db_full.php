<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

app()->instance('verdict.unlock', true);

$excelData = json_decode(file_get_contents('/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/scratch/irshad_excel_summary.json'), true);

$TICKER_MAP = ['OKOMU' => 'OKOMUOIL', 'BERGER' => 'JBERGER'];
$updated = 0;

echo "Syncing DB AaoifiScreening records to match Excel perfectly...\n\n";

foreach ($excelData as $row) {
    $ticker = strtoupper($row['ticker']);
    $dbTicker = $TICKER_MAP[$ticker] ?? $ticker;
    
    $c = \App\Models\Company::where('symbol', $dbTicker)->first();
    if (!$c) {
        echo "NOT FOUND IN DB: {$ticker}\n";
        continue;
    }
    
    $a = \App\Models\AaoifiScreening::where('company_id', $c->id)->first();
    if (!$a) {
        echo "No screening record for {$dbTicker}, skipping.\n";
        continue;
    }

    // Convert Excel fractions to percentages for the DB
    $debtRatio = round((float) ($row['debtMktCap'] ?? 0) * 100, 4);
    $cashRatio = round((float) ($row['cashMktCap'] ?? 0) * 100, 4);
    $incRatio  = round((float) ($row['finIncRev'] ?? 0) * 100, 4);

    $a->debt_ratio = $debtRatio;
    $a->cash_ratio = $cashRatio;
    $a->impermissible_income_ratio = $incRatio;

    $a->debt_status = (strtolower($row['debtVerdict'] ?? '') === 'ok') ? 'pass' : 'fail';
    $a->cash_status = (strtolower($row['cashVerdict'] ?? '') === 'ok') ? 'pass' : 'fail';
    $a->impermissible_income_status = (strtolower($row['finIncVerdict'] ?? '') === 'ok') ? 'pass' : 'fail';

    $finalStatus = ($row['finalVerdict'] === 'PASS') ? 'halal' : 'non-halal';
    $a->final_status = $finalStatus;

    $a->saveQuietly();

    if ($c->current_status !== $finalStatus) {
        $c->current_status = $finalStatus;
        $c->save();
    }
    
    $updated++;
    echo "✅ Synced {$dbTicker}: Debt {$debtRatio}% | Cash {$cashRatio}% | Inc {$incRatio}% -> {$finalStatus}\n";
}

echo "\nDone. Updated {$updated} records to match Excel exactly.\n";
