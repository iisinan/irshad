<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Models\Financial;
use App\Services\AaoifiScreeningService;

$dumpFile = 'db_dump3.json';
$data = json_decode(file_get_contents($dumpFile), true);
$screeningService = app(AaoifiScreeningService::class);

$count = 0;
foreach ($data as $item) {
    if (empty($item['symbol'])) continue;
    
    $financialData = $item['aaoifi_screening']['financial_data_used'] ?? null;
    if (!$financialData || empty($financialData['total_revenue'])) continue;

    $company = Company::where('symbol', $item['symbol'])->first();
    if (!$company) {
        echo "Company not found: {$item['symbol']}\n";
        continue;
    }
    
    // Check if we already have financials
    $existing = Financial::where('company_id', $company->id)->first();
    if (!$existing) {
        $existing = new Financial();
        $existing->company_id = $company->id;
    }
    
    $existing->total_assets = $financialData['total_assets'] ?? 0;
    $existing->total_debt = $financialData['total_debt'] ?? 0;
    $existing->interest_income = $financialData['interest_income'] ?? 0;
    $existing->total_revenue = $financialData['total_revenue'] ?? 0;
    
    // If the json doesn't have market_cap explicitly, use the root company's market_cap 
    // or let the aaoifi screening pull live data.
    $existing->market_cap = $financialData['market_cap'] ?? $item['market_cap'] ?? 0;
    
    $existing->cash_and_equivalents = $financialData['cash'] ?? 0;
    $existing->interest_bearing_securities = $financialData['interest_bearing_securities'] ?? 0;
    $existing->save();
    
    // Rerun screening for the company since we added/updated its financial data
    try {
        $screeningService->screenCompany($company);
        $count++;
        echo "Restored and Screened: {$company->symbol}\n";
    } catch (\Exception $e) {
        echo "Failed screening {$company->symbol}: " . $e->getMessage() . "\n";
    }
}
echo "Done! Restored financials for $count companies.\n";
