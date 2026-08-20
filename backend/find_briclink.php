<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$company = App\Models\Company::where('name', 'like', '%BRICLINK%')->first();
if ($company) {
    echo "Found: " . $company->symbol . "\n";
} else {
    echo "Not found.\n";
}
