<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$company = \App\Models\Company::with(['aaoifiScreening', 'status'])->where('symbol', 'HONYFLOUR')->first();

if ($company) {
    $company->update(['current_status' => 'non-halal']);
    
    if ($company->aaoifiScreening) {
        $company->aaoifiScreening->update(['final_status' => 'non-halal']);
    }
    
    if ($company->status) {
        $company->status->update([
            'status' => 'non-halal',
            'verified_by_scholar' => true,
            'reason' => 'Manually set to non-halal per user request.'
        ]);
    } else {
        $company->status()->create([
            'status' => 'non-halal',
            'verified_by_scholar' => true,
            'reason' => 'Manually set to non-halal per user request.'
        ]);
    }
    echo "HONYFLOUR successfully set to non-halal.\n";
} else {
    echo "HONYFLOUR not found.\n";
}
