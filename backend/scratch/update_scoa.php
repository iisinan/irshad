<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = \App\Models\Company::where('name', 'iLIKE', '%S C O A%')->first();
if ($company) {
    $screening = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();
    if ($screening) {
        $screening->business_status = 'pass';
        $screening->business_reasoning = json_encode(['summary' => 'Diversified trading conglomerate that operates in automotive distribution, industrial equipment, and engineering infrastructure - permissible core activity.']);
        $screening->save();
        echo "Successfully updated SCOA's business status to PASS and updated reasoning.\n";
    }
}
