<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\DailyPrice;
use App\Models\Financial;
use App\Models\StockStatus;
use Illuminate\Support\Str;

echo "Seeding additional companies and ensuring daily prices...\n";

// First, fix existing companies that have no daily_prices
$existingCompanies = Company::all();
foreach ($existingCompanies as $company) {
    if ($company->dailyPrices()->count() === 0) {
        $price = mt_rand(1000, 150000) / 100; // Between 10.00 and 1500.00
        $prevPrice = $price + (mt_rand(-5000, 5000) / 100);
        
        // Latest price
        DailyPrice::create([
            'company_id' => $company->id,
            'date' => now()->toDateString(),
            'price' => max(1, $price),
            'volume' => mt_rand(10000, 5000000),
        ]);
        
        // Previous price (to calculate change)
        DailyPrice::create([
            'company_id' => $company->id,
            'date' => now()->subDay()->toDateString(),
            'price' => max(1, $prevPrice),
            'volume' => mt_rand(10000, 5000000),
        ]);
        echo "Added prices for {$company->symbol}\n";
    }
}

// Generate 100 fake NGX companies
$sectors = ['Financial Services', 'Industrial Goods', 'Consumer Goods', 'Oil and Gas', 'ICT', 'Agriculture', 'Healthcare', 'Services'];
$businessTypes = ['Banking', 'Cement', 'Food', 'Energy', 'Telecommunications', 'Farming', 'Pharmaceuticals', 'Logistics'];

$added = 0;
while ($added < 100) {
    $symbol = strtoupper(Str::random(5));
    if (Company::where('symbol', $symbol)->exists()) continue;
    
    $sectorIdx = mt_rand(0, count($sectors) - 1);
    
    $company = Company::create([
        'name' => $symbol . ' PLC',
        'symbol' => $symbol,
        'sector' => $sectors[$sectorIdx],
        'business_type' => $businessTypes[$sectorIdx],
        'description' => 'A leading company in the ' . $sectors[$sectorIdx] . ' sector.',
        'overview' => $symbol . ' is a leading company in Nigeria focused on sustainable growth and delivering value.',
        'analysts_target' => mt_rand(5000, 200000) / 100,
        'valuation_info' => mt_rand(0, 1) ? 'Undervalued by 20%' : 'Fairly Valued',
        'growth_info' => 'Earnings are forecast to grow 15% per year',
        'div_yield' => mt_rand(100, 1200) / 100,
    ]);
    
    // Add financial data
    $marketCap = mt_rand(10000000000, 5000000000000); // 10B to 5T
    $totalAssets = $marketCap * (mt_rand(50, 200) / 100);
    
    // Make 80% Halal
    $isHalal = mt_rand(1, 100) <= 80;
    
    if ($isHalal) {
        $totalDebt = $totalAssets * (mt_rand(1, 25) / 100); // < 30%
        $totalRevenue = $totalAssets * 0.5;
        $interestIncome = $totalRevenue * (mt_rand(1, 4) / 100); // < 5%
    } else {
        $totalDebt = $totalAssets * (mt_rand(40, 80) / 100); // > 30%
        $totalRevenue = $totalAssets * 0.5;
        $interestIncome = $totalRevenue * (mt_rand(10, 20) / 100); // > 5%
    }
    
    Financial::create([
        'company_id' => $company->id,
        'reporting_period' => '2026-Q2',
        'total_assets' => $totalAssets,
        'total_debt' => $totalDebt,
        'total_revenue' => $totalRevenue,
        'market_cap' => $marketCap,
        'interest_income' => $interestIncome,
        'non_halal_income' => $interestIncome,
    ]);
    
    // Status
    StockStatus::create([
        'company_id' => $company->id,
        'status' => $isHalal ? 'halal' : 'non-halal',
        'reason' => $isHalal ? 'Stock passes all screens cleanly. Status is 100% Halal and Shariah-compliant.' : 'Failed AAOIFI Debt or Interest limits.',
        'last_updated' => now(),
    ]);
    
    // Prices
    $price = mt_rand(1000, 150000) / 100;
    $prevPrice = $price + (mt_rand(-5000, 5000) / 100);
    
    DailyPrice::create([
        'company_id' => $company->id,
        'date' => now()->toDateString(),
        'price' => max(1, $price),
        'volume' => mt_rand(10000, 5000000),
    ]);
    
    DailyPrice::create([
        'company_id' => $company->id,
        'date' => now()->subDay()->toDateString(),
        'price' => max(1, $prevPrice),
        'volume' => mt_rand(10000, 5000000),
    ]);
    
    $added++;
}

echo "Successfully seeded 100 new companies and populated prices!\n";
