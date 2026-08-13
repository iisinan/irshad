<?php
$company = App\Models\Company::where('symbol', 'UPDCREIT')->first();
if ($company) {
    $screening = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    if ($screening) {
        $screening->business_status = 'pass';
        $screening->business_reasoning = 'Real estate investment trust - permissible core activity; check tenant mix.';
        $screening->final_status = 'halal';
        $screening->save();
        echo "UPDCREIT successfully updated to Halal!\n";
    }
}
