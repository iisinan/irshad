<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$company = App\Models\Company::where('symbol', 'AUSTINLAZ')->first();
if ($company) {
    $screening = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    if ($screening) {
        $screening->reporting_period = 'Q2';
        $screening->reporting_year = '2026';
        $screening->published_date = '2026-07-25';
        $screening->save();
        echo "Updated AUSTINLAZ correctly!\n";
    } else {
        echo "AUSTINLAZ screening not found.\n";
    }
} else {
    echo "AUSTINLAZ company not found.\n";
}
