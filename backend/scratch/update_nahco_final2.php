<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use Illuminate\Support\Facades\DB;

$company = Company::where('symbol', 'NAHCO')->first();
if ($company) {
    // 2. Update Business Activity Screening in aaoifi_screenings
    DB::table('aaoifi_screenings')
        ->where('company_id', $company->id)
        ->update(['business_reasoning' => json_encode('Permissible core activity.')]);
    echo "Updated Business Activity Screening (aaoifi_screenings.business_reasoning) to JSON.\n";
}
