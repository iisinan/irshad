<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$companies = \App\Models\Company::with('aaoifiScreening')->get();
$results = [];

foreach ($companies as $company) {
    if ($company->aaoifiScreening) {
        $results[] = [
            'symbol' => $company->symbol,
            'business_status' => $company->aaoifiScreening->business_status,
            'business_reasoning' => $company->aaoifiScreening->business_reasoning,
        ];
    }
}

file_put_contents('db_dump.json', json_encode($results, JSON_PRETTY_PRINT));
echo "Dumped ".count($results)." records.\n";
