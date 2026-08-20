<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Print columns
echo "Columns in aaoifi_screenings:\n";
print_r(\Schema::getColumnListing('aaoifi_screenings'));

echo "\nChecking DANGSUGAR and NASCON:\n";
$companies = App\Models\Company::whereIn('symbol', ['DANGSUGAR', 'NASCON'])->get();
foreach ($companies as $company) {
    echo "Company: " . $company->symbol . "\n";
    $screening = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    if ($screening) {
        echo " - Screening ID: " . $screening->id . "\n";
        echo " - Published Date/Quarter attributes if any: \n";
        print_r($screening->toArray());
    } else {
        echo " - No screening found.\n";
    }
}
