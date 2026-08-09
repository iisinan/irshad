<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = App\Models\Company::where('symbol', 'GEREGU')->first();
if (!$company) {
    echo "GEREGU not found in companies table.\n";
    exit;
}

$aaoifi = App\Models\AaoifiScreening::where('company_id', $company->id)->first();
if (!$aaoifi) {
    $aaoifi = new App\Models\AaoifiScreening();
    $aaoifi->company_id = $company->id;
}

$aaoifi->debt_ratio = 27.13;
$aaoifi->cash_ratio = 26.92;
$aaoifi->impermissible_income_ratio = 1.96;

$aaoifi->business_status = 'pass';
$aaoifi->business_reasoning = json_encode(['justification' => 'Permissible core activity.']);
$aaoifi->final_status = 'compliant';

$aaoifi->save();

echo "Updated GEREGU AAOIFI status to Compliant!\n";
