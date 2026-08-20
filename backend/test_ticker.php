<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$companies = App\Models\Company::where('name', 'like', '%BRIC%')->orWhere('symbol', 'like', '%BRIC%')->get();
foreach ($companies as $c) {
    echo $c->symbol . " - " . $c->name . "\n";
}
