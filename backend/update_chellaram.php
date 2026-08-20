<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$company = App\Models\Company::where('symbol', 'CHELLARAM')->first();
if ($company) {
    $screening = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    if ($screening) {
        $screening->reporting_period = 'Q1';
        $screening->reporting_year = '2026';
        $screening->published_date = '2026-07-31';
        $screening->save();
        echo "Updated CHELLARAM correctly!\n";
    } else {
        echo "CHELLARAM screening not found.\n";
    }
} else {
    echo "CHELLARAM company not found.\n";
}
