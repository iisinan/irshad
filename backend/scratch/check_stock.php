<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = app(\App\Http\Controllers\StockController::class);
$response = $controller->show('AIRTELAFRI');
echo json_encode($response->getData(true), JSON_PRETTY_PRINT);
