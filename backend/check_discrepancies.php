<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$companies = App\Models\Company::with(['status', 'aaoifiScreening'])->get();
$discrepancies = [];
foreach ($companies as $company) {
    if ($company->status && $company->aaoifiScreening) {
        $manual = strtolower($company->status->status);
        $automated = strtolower($company->aaoifiScreening->final_status);
        if ($manual !== $automated) {
            $discrepancies[] = [
                'symbol' => $company->symbol,
                'manual' => $manual,
                'automated' => $automated,
                'reason' => $company->status->reason
            ];
        }
    }
}
echo json_encode($discrepancies, JSON_PRETTY_PRINT);
