<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

app()->instance('verdict.unlock', true);

use App\Models\Company;

$companies = Company::with(['aaoifiScreening', 'status'])->get();

foreach ($companies as $company) {
    $screening = $company->aaoifiScreening;
    if (!$screening) continue;

    $statusModel = $company->status()->first();
    if ($statusModel && $statusModel->verified_by_scholar) {
        continue;
    }

    $expectedFinalStatus = 'halal';
    
    if ($screening->business_status === 'fail' || $screening->business_status === 'non-halal') {
        $expectedFinalStatus = 'non-halal';
    } elseif ($screening->business_status === 'warning' || $screening->business_status === 'doubtful' || $screening->business_status === 'insufficient_data') {
        $expectedFinalStatus = 'doubtful';
    } else {
        if ($screening->debt_status === 'fail' || $screening->cash_status === 'fail' || $screening->impermissible_income_status === 'fail') {
            $expectedFinalStatus = 'non-halal';
        } elseif (in_array($screening->debt_status, ['warning', 'doubtful', 'insufficient_data']) ||
                  in_array($screening->cash_status, ['warning', 'doubtful', 'insufficient_data']) ||
                  in_array($screening->impermissible_income_status, ['warning', 'doubtful', 'insufficient_data'])) {
            $expectedFinalStatus = 'doubtful';
        } else {
            $expectedFinalStatus = 'halal';
        }
    }
    
    if ($company->current_status !== $expectedFinalStatus) {
        echo "Updating " . $company->symbol . " from " . $company->current_status . " to " . $expectedFinalStatus . "\n";
        $company->current_status = $expectedFinalStatus;
        $company->save();
        
        $screening->final_status = $expectedFinalStatus;
        $screening->save();
        
        if ($statusModel) {
            $statusModel->status = $expectedFinalStatus;
            $statusModel->save();
        }
    }
}
echo "Done syncing statuses directly.\n";
