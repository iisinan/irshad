<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = $app->make(\App\Services\AaoifiScreeningService::class);
$companies = \App\Models\Company::all();

echo "Screening " . $companies->count() . " companies...\n";
foreach($companies as $company) {
    try {
        $service->screenCompany($company);
    } catch (\Exception $e) {
        echo "Error screening {$company->symbol}: " . $e->getMessage() . "\n";
    }
}
echo "Done.\n";
