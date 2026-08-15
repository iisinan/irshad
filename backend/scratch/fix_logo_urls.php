<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$companies = Company::whereNotNull('logo_url')->get();
$count = 0;
foreach ($companies as $company) {
    $url = $company->getRawOriginal('logo_url');
    if (strpos($url, '/storage/logos/') !== false) {
        $filename = basename($url);
        $company->logo_url = "/logos/{$filename}";
        $company->save();
        $count++;
    } elseif (strpos($url, 'https://backend.test/storage/logos/') !== false) {
        $filename = basename($url);
        $company->logo_url = "/logos/{$filename}";
        $company->save();
        $count++;
    }
}

echo "Fixed $count logo URLs.\n";
\Illuminate\Support\Facades\Artisan::call('cache:clear');
