<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$res = \App\Models\Company::whereIn('symbol', ['OANDO', 'CONOIL'])->with('financials')->get()->toArray();
echo json_encode($res, JSON_PRETTY_PRINT);

