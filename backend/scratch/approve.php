<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$review = \App\Models\ComplianceReview::whereHas('company', function($q) {
    $q->where('symbol', 'DANGCEM');
})->where('status', 'pending')->first();

if ($review) {
    $review->status = 'approved';
    $review->reviewed_by = 1;
    $review->reviewed_at = now();
    $review->save();
    
    $payload = $review->payload;
    
    $financial = \App\Models\Financial::where('company_id', $review->company_id)->latest()->first();
    if ($financial) {
        $financial->update($payload);
    } else {
        $financial = \App\Models\Financial::create(array_merge(['company_id' => $review->company_id], $payload));
    }
    
    app(\App\Services\AaoifiComplianceService::class)->evaluateCompliance($review->company, $financial, $review->company->sector);
    
    echo "Approved DANGCEM\n";
} else {
    echo "No pending review for DANGCEM\n";
}
