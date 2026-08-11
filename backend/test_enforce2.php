<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$company = \App\Models\Company::with(['aaoifiScreening', 'status'])->where('symbol', 'HONYFLOUR')->first();
$screening = $company->aaoifiScreening;
$statusModel = $company->status()->first();

$oldFinalStatus = $screening->final_status;
$expectedFinalStatus = 'doubtful'; // We know this

$oldStatus = $company->current_status;
echo "Old Status: $oldStatus\n";
$isHalalToNonHalal = ($oldStatus === 'halal' && $expectedFinalStatus === 'non-halal');
$isNonHalalToHalal = ($oldStatus === 'non-halal' && $expectedFinalStatus === 'halal');

if ($company->current_status !== $expectedFinalStatus) {
    echo "Updating company status to $expectedFinalStatus\n";
    $company->update(['current_status' => $expectedFinalStatus]);
}

if ($statusModel) {
    echo "Updating stock status to $expectedFinalStatus\n";
    $statusModel->update([
        'status' => $expectedFinalStatus,
        'reason' => 'Automated test',
    ]);
}
