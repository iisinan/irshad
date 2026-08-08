<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;

$company = Company::where('symbol', 'JAIZBANK')->first();
if ($company) {
    $company->current_status = 'halal';
    $company->save();
    
    $screening = AaoifiScreening::where('company_id', $company->id)->first();
    if ($screening) {
        $screening->cash_status = 'pass';
        $screening->final_status = 'halal';
        $screening->save();
        echo "Successfully updated JAIZBANK to halal\n";
    }
}
