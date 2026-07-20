<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = Illuminate\Http\Request::create('/api/v1/stocks/baskets/1', 'GET');
$response = $kernel->handle($request);
echo "Status: " . $response->status() . "\n";
echo "Content: " . $response->content() . "\n";
