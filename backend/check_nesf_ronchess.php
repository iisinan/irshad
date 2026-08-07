<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$symbols = ['NESF', 'RONCHESS'];
$data = [];

foreach ($symbols as $sym) {
    $company = \App\Models\Company::where('symbol', $sym)->first();
    if (!$company) {
        $data[$sym] = 'Company not found';
        continue;
    }
    
    $status = $company->status;
    $financial = $company->financials()->latest()->first();
    $aaoifi = $company->aaoifiScreening;
    
    $data[$sym] = [
        'company' => [
            'id' => $company->id,
            'name' => $company->name,
            'symbol' => $company->symbol,
            'market_cap' => $company->market_cap,
            'industry' => $company->industry,
            'sector' => $company->sector,
            'activity_reason' => $company->activity_reason,
            'status_record' => $status ? [
                'status' => $status->status,
                'reason' => $status->reason,
                'verified_by_scholar' => $status->verified_by_scholar,
            ] : null,
        ],
        'financial' => $financial ? [
            'reporting_period' => $financial->reporting_period,
            'financial_year' => $financial->financial_year,
            'total_assets' => $financial->total_assets,
            'total_debt' => $financial->total_debt,
            'cash_and_equivalents' => $financial->cash_and_equivalents,
            'interest_bearing_securities' => $financial->interest_bearing_securities,
            'interest_income' => $financial->interest_income,
            'total_revenue' => $financial->total_revenue,
            'market_cap' => $financial->market_cap,
            'source_url' => $financial->source_url,
        ] : null,
        'aaoifi' => $aaoifi ? [
            'final_status' => $aaoifi->final_status,
            'business_status' => $aaoifi->business_status,
            'debt_ratio' => $aaoifi->debt_ratio,
            'debt_status' => $aaoifi->debt_status,
            'cash_ratio' => $aaoifi->cash_ratio,
            'cash_status' => $aaoifi->cash_status,
            'impermissible_income_ratio' => $aaoifi->impermissible_income_ratio,
            'impermissible_income_status' => $aaoifi->impermissible_income_status,
            'illiquid_ratio' => $aaoifi->illiquid_ratio,
            'receivables_ratio' => $aaoifi->receivables_ratio,
            'financial_data_used' => $aaoifi->financial_data_used,
            'business_reasoning' => $aaoifi->business_reasoning,
        ] : null,
    ];
}

echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
