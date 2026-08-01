<?php

use App\Models\Company;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);

echo 'DANGCEM exists: '.(Company::where('symbol', 'DANGCEM')->exists() ? 'Yes' : 'No')."\n";
$c = Company::first();
if ($c) {
    echo 'First company: '.$c->symbol."\n";
    $request = Request::create('/api/stocks/'.$c->symbol.'/aaoifi-screening', 'GET');
    $response = $kernel->handle($request);
    echo 'Status: '.$response->getStatusCode()."\n";
    echo 'Content: '.$response->getContent()."\n";
} else {
    echo "No companies in DB.\n";
}
