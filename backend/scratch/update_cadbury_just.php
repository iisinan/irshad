<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\StockStatus;

$c = Company::where('symbol', 'CADBURY')->first();
if ($c) {
    $status = StockStatus::where('company_id', $c->id)->first();
    if ($status) {
        $status->reason = "Permissible core activity. Additionally, it passes all AAOIFI quantitative financial screening ratios.";
        $status->save();
        echo "CADBURY custom reason updated.\n";
    }
}
