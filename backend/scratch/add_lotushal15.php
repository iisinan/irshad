<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::updateOrCreate(
    ['symbol' => 'LOTUSHAL15'],
    [
        'name' => 'Lotus Halal Equity ETF',
        'sector' => 'Exchange Traded Funds',
        'industry' => 'ETF',
        'business_type' => 'Unknown',
        'description' => 'Lotus Halal Equity ETF, managed by Lotus Capital - explicitly tracks the NGX-Lotus Islamic Index.',
        'current_status' => 'halal',
        'is_active' => true,
        'activity_reason' => 'Lotus Halal Equity ETF, managed by Lotus Capital - explicitly tracks the NGX-Lotus Islamic Index, which is pre-screened to exclude conventional banks, insurance, alcohol, gambling and other impermissible activities.'
    ]
);

$screening = App\Models\AaoifiScreening::updateOrCreate(
    ['company_id' => $company->id],
    [
        'business_status' => 'pass',
        'business_reasoning' => 'Lotus Halal Equity ETF, managed by Lotus Capital - explicitly tracks the NGX-Lotus Islamic Index, which is pre-screened to exclude conventional banks, insurance, alcohol, gambling and other impermissible activities, with financial-ratio screening (debt, cash, interest income) built into index eligibility. The only NGX-listed equity ETF designed from inception to be Shariah-compliant.',
        'debt_ratio' => '0.0000',
        'debt_status' => 'pass',
        'cash_ratio' => '0.0000',
        'cash_status' => 'pass',
        'impermissible_income_ratio' => '0.0000',
        'impermissible_income_status' => 'pass',
        'final_status' => 'halal',
        'financial_data_used' => [
            'source' => 'Manual entry - Halal Fund',
            'market_cap' => 0,
            'total_assets' => 0,
            'total_debt' => 0,
            'cash' => 0,
            'interest_bearing_securities' => 0,
            'accounts_receivable' => 0,
            'illiquid_assets' => 0,
            'interest_income' => 0,
            'total_revenue' => 0,
            'source_url' => '',
            'published_date' => null,
            'reporting_period' => '2026-Q2',
            'financial_year' => '2026'
        ],
        'reporting_year' => 2026,
        'reporting_period' => 'Q2'
    ]
);

echo "Added LOTUSHAL15 as halal successfully.\n";
