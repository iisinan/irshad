<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$company = Company::where('name', 'like', '%SHA%')->get();
foreach ($company as $c) {
    echo "Symbol: " . $c->symbol . " - " . $c->name . "\n";
}
