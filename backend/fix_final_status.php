<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$screenings = \App\Models\AaoifiScreening::all();
$count = 0;
foreach ($screenings as $screening) {
    $company = $screening->company;
    if (!$company) continue;

    $busStatus = $screening->business_status ?: 'pass';
    $busPass = in_array(strtolower($busStatus), ['pass', 'halal']);
    $finPass = ($screening->debt_status == 'pass' && $screening->cash_status == 'pass' && $screening->impermissible_income_status == 'pass');

    $newFinalStatus = ($busPass && $finPass) ? 'halal' : 'non-halal';

    if ($screening->final_status != $newFinalStatus) {
        $screening->final_status = $newFinalStatus;
        $screening->save();
        
        if ($company->current_status != $newFinalStatus) {
            $company->current_status = $newFinalStatus;
            $company->save();
        }
        
        $status = $company->status;
        if ($status && $status->status != $newFinalStatus) {
            $status->status = $newFinalStatus;
            $status->save();
        } elseif (!$status) {
            $company->status()->create(['status' => $newFinalStatus, 'verified_by_scholar' => false]);
        }
        
        $count++;
        echo "Fixed " . $company->symbol . " to " . strtoupper($newFinalStatus) . "\n";
    }
}
echo "Fixed $count companies.\n";
