<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$company = \App\Models\Company::with(['aaoifiScreening', 'status'])->where('symbol', 'NASCON')->first();

if (!$company) {
    echo "NASCON not found.\n";
    exit;
}

echo "=== NASCON ===\n";
echo "Company current_status: " . $company->current_status . "\n";
echo "Market Cap: " . $company->market_cap . "\n";

if ($company->status) {
    echo "StockStatus status: " . $company->status->status . "\n";
    echo "StockStatus reason: " . $company->status->reason . "\n";
    echo "Verified by scholar: " . ($company->status->verified_by_scholar ? 'Yes' : 'No') . "\n";
} else {
    echo "StockStatus: Missing\n";
}

if ($company->aaoifiScreening) {
    $s = $company->aaoifiScreening;
    echo "Screening final_status: " . $s->final_status . "\n";
    echo "Screening business_status: " . $s->business_status . "\n";
    echo "Screening debt_ratio: " . $s->debt_ratio . " (" . $s->debt_status . ")\n";
    echo "Screening cash_ratio: " . $s->cash_ratio . " (" . $s->cash_status . ")\n";
    echo "Screening impure_ratio: " . $s->impermissible_income_ratio . " (" . $s->impermissible_income_status . ")\n";
    
    $fd = is_array($s->financial_data_used) ? $s->financial_data_used : json_decode($s->financial_data_used, true);
    echo "Total Assets (JSON): " . ($fd['total_assets'] ?? 'null') . "\n";
    echo "Total Debt (JSON): " . ($fd['total_debt'] ?? 'null') . "\n";
    echo "Cash (JSON): " . ($fd['cash'] ?? 'null') . "\n";
} else {
    echo "Screening: Missing\n";
}
