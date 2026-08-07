<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$companies = \App\Models\Company::with(['status', 'aaoifiScreening'])->get();
$issues = [];

foreach ($companies as $company) {
    $aaoifi = $company->aaoifiScreening;
    $statusRecord = $company->status;
    $reasonText = strtolower($company->activity_reason ?? ($statusRecord->reason ?? ''));
    
    if (!$aaoifi) {
        continue;
    }
    
    $impermissibleIncome = (float) $aaoifi->impermissible_income_ratio;
    $cashRatio = (float) $aaoifi->cash_ratio;
    $debtRatio = (float) $aaoifi->debt_ratio;
    
    $finalStatus = $aaoifi->final_status;
    $issuesFound = [];
    
    // Issue 1: Ratio fails but status is halal
    if ($cashRatio > 30 && $finalStatus === 'halal') {
        $issuesFound[] = "Cash Ratio ($cashRatio%) > 30% but Final Status is Halal";
    }
    if ($debtRatio > 30 && $finalStatus === 'halal') {
        $issuesFound[] = "Debt Ratio ($debtRatio%) > 30% but Final Status is Halal";
    }
    if ($impermissibleIncome > 5 && $finalStatus === 'halal') {
        $issuesFound[] = "Impermissible Income ($impermissibleIncome%) > 5% but Final Status is Halal";
    }
    
    // Issue 2: Text summary claims zero impermissible income, but ratio is > 0
    if ($impermissibleIncome > 0) {
        if (str_contains($reasonText, 'zero impermissible income') || str_contains($reasonText, 'no impermissible income')) {
            $issuesFound[] = "Summary claims 'zero impermissible income' but actual ratio is $impermissibleIncome%";
        }
    }
    
    // Issue 3: Status says 'cash_status' pass but ratio > 30
    if ($cashRatio > 30 && $aaoifi->cash_status === 'pass') {
        $issuesFound[] = "cash_status is 'pass' but ratio is $cashRatio%";
    }
    if ($debtRatio > 30 && $aaoifi->debt_status === 'pass') {
        $issuesFound[] = "debt_status is 'pass' but ratio is $debtRatio%";
    }

    if (!empty($issuesFound)) {
        $issues[] = [
            'symbol' => $company->symbol,
            'name' => $company->name,
            'final_status' => $finalStatus,
            'issues' => $issuesFound
        ];
    }
}

echo json_encode($issues, JSON_PRETTY_PRINT);
