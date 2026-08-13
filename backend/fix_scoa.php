<?php
// Restore SCOA to Pass/Needs data
$scoa = App\Models\Company::where('symbol', 'SCOA')->first();
if ($scoa) {
    $screening = App\Models\AaoifiScreening::where('company_id', $scoa->id)->first();
    if ($screening) {
        $screening->business_status = 'pass';
        $screening->final_status = 'needs_data';
        $screening->save();
        echo "SCOA set to Needs Data.\n";
    }
}
