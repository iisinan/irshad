<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$companies = App\Models\Company::all();
foreach ($companies as $company) {
    if (stripos(strtolower($company->name), 'bric') !== false || stripos(strtolower($company->symbol), 'bric') !== false) {
        echo $company->symbol . " - " . $company->name . "\n";
    }
}
