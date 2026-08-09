<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

app()->instance('verdict.unlock', true);

$screenings = \App\Models\AaoifiScreening::with('company')->get();
$updatedCount = 0;
$verdictChanges = [];

foreach ($screenings as $s) {
    $company = $s->company;
    if (!$company) continue;

    $oldStatus = $s->final_status;

    // AAOIFI Rules
    $debtPass = $s->debt_ratio < 30;
    $cashPass = $s->cash_ratio < 30;
    $incPass = $s->impermissible_income_ratio < 5;
    $businessPass = strtolower($s->business_status) === 'pass';

    $s->debt_status = $debtPass ? 'pass' : 'fail';
    $s->cash_status = $cashPass ? 'pass' : 'fail';
    $s->impermissible_income_status = $incPass ? 'pass' : 'fail';

    $isHalal = $businessPass && $debtPass && $cashPass && $incPass;
    
    // Default new status
    $newStatus = $isHalal ? 'halal' : 'non-halal';

    // If it was doubtful, we might want to keep it doubtful manually, but for now we recalculate strictly based on rules.
    // If we want to preserve doubtful, we'd check $company->current_status
    if (strtolower($company->current_status) === 'doubtful') {
        $newStatus = 'doubtful';
    }

    $s->final_status = $newStatus;
    
    if ($s->isDirty()) {
        $s->saveQuietly();
    }

    if ($company->current_status !== $newStatus) {
        $company->current_status = $newStatus;
        $company->save();
        $verdictChanges[] = "{$company->symbol}: {$oldStatus} -> {$newStatus}";
    }
    
    $updatedCount++;
}

echo "Recalculated AAOIFI verdicts for {$updatedCount} records.\n\n";

if (count($verdictChanges) > 0) {
    echo "Verdict Changes:\n";
    foreach ($verdictChanges as $change) {
        echo "- {$change}\n";
    }
} else {
    echo "No final verdicts changed as a result of the recalculation.\n";
}
