<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = app()->make(App\Http\Controllers\StockController::class);
$response = $controller->aaoifiScreening('DAARCOMM');
echo json_encode($response->getData(), JSON_PRETTY_PRINT);
