<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

echo "DANGCEM exists: " . (\App\Models\Company::where('symbol', 'DANGCEM')->exists() ? "Yes" : "No") . "\n";
$c = \App\Models\Company::first();
if ($c) {
    echo "First company: " . $c->symbol . "\n";
    $request = Illuminate\Http\Request::create('/api/stocks/' . $c->symbol . '/aaoifi-screening', 'GET');
    $response = $kernel->handle($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Content: " . $response->getContent() . "\n";
} else {
    echo "No companies in DB.\n";
}
