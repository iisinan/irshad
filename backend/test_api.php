<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$controller = $app->make(\App\Http\Controllers\StockController::class);
$response = $controller->aaoifiScreening('HONYFLOUR');
echo $response->getContent();
