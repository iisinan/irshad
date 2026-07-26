<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;
use App\Models\Company;
use App\Models\StockStatus;

$screenings = AaoifiScreening::with('company')->get();

$stats = ['halal' => 0, 'non-halal' => 0, 'doubtful' => 0, 'errors' => 0];

foreach ($screenings as $s) {
    if (!$s->company) continue;

    // Recalculate status based on new rules
    // debtRatio <= 30 => pass, else fail
    $debtRatio = $s->debt_ratio;
    $debtStatus = 'insufficient_data';
    if ($debtRatio !== null) {
        $debtStatus = $debtRatio <= 30 ? 'pass' : 'fail';
    }

    $cashRatio = $s->cash_ratio;
    $cashStatus = 'insufficient_data';
    if ($cashRatio !== null) {
        $cashStatus = $cashRatio <= 30 ? 'pass' : 'fail';
    }

    $businessStatus = $s->business_status;

    // Final Verdict Engine
    $finalStatus = 'halal';
    if ($businessStatus === 'fail' || $debtStatus === 'fail' || $cashStatus === 'fail') {
        $finalStatus = 'non-halal';
    } elseif ($businessStatus === 'warning' || $debtStatus === 'insufficient_data' || $cashStatus === 'insufficient_data') {
        $finalStatus = 'doubtful';
    }

    // Update AaoifiScreening
    $s->debt_status = $debtStatus;
    $s->cash_status = $cashStatus;
    $s->final_status = $finalStatus;
    $s->save();

    // Sync with Company
    $company = $s->company;
    $company->current_status = $finalStatus;
    $company->save();

    // Sync with StockStatus
    $stockStatus = $company->status()->first();
    if (!$stockStatus || !$stockStatus->verified_by_scholar) {
        StockStatus::updateOrCreate(
            ['company_id' => $company->id],
            [
                'status' => $finalStatus,
                'reason' => $finalStatus === 'non-halal'
                    ? ($businessStatus === 'fail' ? "Failed Rule 1: Non-compliant business activity." : "Failed AAOIFI financial ratio screening.")
                    : "Stock passes all screens cleanly. Status is 100% Halal and Shariah-compliant.",
                'verified_by_scholar' => false,
                'last_updated' => now(),
            ]
        );
    }

    $stats[$finalStatus]++;
}

echo "Recalculation Complete.\n";
echo "Halal: {$stats['halal']}\n";
echo "Non-halal: {$stats['non-halal']}\n";
echo "Doubtful: {$stats['doubtful']}\n";
