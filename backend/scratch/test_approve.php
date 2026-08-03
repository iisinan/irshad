<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ComplianceReview;
use App\Models\Company;
use App\Models\Financial;
use App\Models\StockStatus;
use App\Models\AaoifiScreening;
use App\Models\ComplianceHistory;
use App\Services\AaoifiComplianceService;

$ticker = 'ARADEL';
$company = Company::where('symbol', $ticker)->first();

$review = ComplianceReview::where('company_id', $company->id)->orderBy('id', 'desc')->first();

if (!$review) {
    echo "No pending review found for $ticker.\n";
    exit;
}

echo "Approving review {$review->id} for {$ticker}...\n";

if (! empty($review->payload)) {
    $financial = $company->latestFinancial;
    if ($financial) {
        $financial->update($review->payload);
    } else {
        $financial = Financial::create(array_merge(
            ['company_id' => $company->id],
            $review->payload
        ));
    }
    $complianceService = app(AaoifiComplianceService::class);
    $complianceService->evaluateCompliance($company, $financial, $company->sector);
}

if ($review->new_status && $review->new_status !== $review->old_status) {
    $company->update(['current_status' => $review->new_status]);
    StockStatus::updateOrCreate(
        ['company_id' => $company->id],
        ['status' => $review->new_status, 'reason' => $review->reason, 'verified_by_scholar' => true, 'last_updated' => now()]
    );
    $aaoifi = AaoifiScreening::where('company_id', $company->id)->latest()->first();
    if ($aaoifi) {
        $aaoifi->update(['final_status' => $review->new_status]);
    }
}

ComplianceHistory::create(['company_id' => $company->id, 'old_status' => $review->old_status, 'new_status' => $review->new_status, 'reason' => $review->reason, 'changed_at' => now()]);
$review->update(['status' => 'approved', 'reviewed_at' => now()]);

echo "Approved! Updated Financials and AAOIFI screening.\n";

$screening = AaoifiScreening::where('company_id', $company->id)->latest()->first();
print_r($screening->toArray());

