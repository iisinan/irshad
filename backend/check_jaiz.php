<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$company = \App\Models\Company::with('aaoifiScreening')->where('symbol', 'JAIZBANK')->first();
if ($company) {
    echo json_encode($company->toArray(), JSON_PRETTY_PRINT);
} else {
    echo "JAIZBANK not found.";
}
