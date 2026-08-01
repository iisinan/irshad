<?php

use App\Models\Company;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$companies = Company::with('aaoifiScreening')->get();
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
echo 'Dumped '.count($results)." records.\n";
