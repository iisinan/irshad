<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ctrl = app(\App\Http\Controllers\StockController::class);
$response = $ctrl->aaoifiScreening('BAPLC');
echo json_encode($response->getData(true), JSON_PRETTY_PRINT) . "\n";
