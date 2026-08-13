<?php
// Restore UPDCREIT to Doubtful
$updc = App\Models\Company::where('symbol', 'UPDCREIT')->first();
if ($updc) {
    $screening = App\Models\AaoifiScreening::where('company_id', $updc->id)->first();
    if ($screening) {
        $screening->business_status = 'doubtful';
        $screening->final_status = 'doubtful';
        $screening->debt_ratio = null;
        $screening->debt_status = null;
        $screening->cash_ratio = null;
        $screening->cash_status = null;
        $screening->impermissible_income_ratio = null;
        $screening->impermissible_income_status = null;
        $screening->financial_data_used = null;
        $screening->save();
        echo "UPDCREIT set to Doubtful.\n";
    }
}
