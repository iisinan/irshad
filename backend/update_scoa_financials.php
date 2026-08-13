<?php
$scoa = App\Models\Company::where('symbol', 'SCOA')->first();
if ($scoa) {
    $screening = App\Models\AaoifiScreening::where('company_id', $scoa->id)->first();
    if ($screening) {
        $screening->debt_ratio = 57.49;
        $screening->debt_status = 'fail';
        
        $screening->cash_ratio = 3.48;
        $screening->cash_status = 'pass';
        
        $screening->impermissible_income_ratio = 5.48;
        $screening->impermissible_income_status = 'fail';
        
        $screening->final_status = 'non-halal'; // Keeping internal DB value as 'non-halal' for now to prevent breaking app
        
        $screening->financial_data_used = [
            'source' => 'SCOA NIGERIA PLC Q2 2026 Unaudited Financial Statements',
            'market_cap' => 21476738228,
            'total_debt' => 12347243090,
            'cash' => 746437170,
            'interest_income' => 269933630,
            'total_revenue' => 4929340350,
            'source_url' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/47682_S_C_O_A__NIGERIA_PLC-_QUARTER_2_-_FINANCIAL_STATEMENT_FOR_2026_FINANCIAL_STATEMENTS_JULY_2026.pdf',
            'published_date' => '2026-07-30',
            'reporting_period' => 'Q2',
            'financial_year' => '2026'
        ];
        
        $screening->save();
        echo "SCOA financials updated successfully!\n";
    }
}
