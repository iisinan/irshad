<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$company = App\Models\Company::where('symbol', 'CHAMS')->first();
if ($company) {
    $screening = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    if ($screening) {
        $screening->reporting_period = 'Q2';
        $screening->reporting_year = '2026';
        $screening->published_date = '2026-07-29';
        $screening->save();
        echo "Updated CHAMS correctly!\n";
    } else {
        echo "CHAMS screening not found.\n";
    }
} else {
    echo "CHAMS company not found.\n";
}
