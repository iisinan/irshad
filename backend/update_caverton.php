<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$company = App\Models\Company::where('symbol', 'CAVERTON')->first();
if ($company) {
    $screening = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    if ($screening) {
        $screening->reporting_period = 'Q2';
        $screening->reporting_year = '2026';
        $screening->published_date = '2026-07-31';
        $screening->save();
        echo "Updated CAVERTON correctly!\n";
    } else {
        echo "CAVERTON screening not found.\n";
    }
} else {
    echo "CAVERTON company not found.\n";
}
