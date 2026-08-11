<?php
$file = fopen('/Users/sinan/Desktop/stocks_financial_data.csv', 'w');
fputcsv($file, [
    'Symbol', 'Company Name', 'Sector', 'Final Status', 
    'Business Reasoning / Justification', 
    'Market Cap', 'Total Assets', 'Total Debt', 'Cash', 'Interest Income', 'Total Revenue',
    'Debt Ratio', 'Cash Ratio', 'Impure Ratio'
]);

$companies = App\Models\Company::with('aaoifiScreening')->get();
foreach ($companies as $c) {
    $screening = $c->aaoifiScreening;
    if (!$screening) continue;
    
    $fd = $screening->financial_data_used ?? [];
    fputcsv($file, [
        $c->symbol,
        $c->name,
        $c->sector,
        $screening->final_status,
        $screening->business_reasoning,
        $fd['market_cap'] ?? '',
        $fd['total_assets'] ?? '',
        $fd['total_debt'] ?? '',
        $fd['cash'] ?? '',
        $fd['interest_income'] ?? '',
        $fd['total_revenue'] ?? '',
        $screening->debt_ratio,
        $screening->cash_ratio,
        $screening->impermissible_income_ratio,
    ]);
}
fclose($file);
echo "Exported to /Users/sinan/Desktop/stocks_financial_data.csv\n";
