<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Models\StockStatus;

app()->instance('verdict.unlock', true);
StockStatus::unsetEventDispatcher();

$symbols = ['RONCHESS', 'BAPLC'];
foreach ($symbols as $sym) {
    $c = Company::where('symbol', $sym)->first();
    if ($c) {
        $status = $c->status()->first();
        if ($status) {
            $reason = $status->reason;
            $reason = preg_replace('/Note:\s*This company is currently not trading on the NGX\.?/i', '', $reason);
            $reason = preg_replace('/This company is currently not trading on the NGX\.?/i', '', $reason);
            $status->reason = trim($reason);
            $status->save();
            echo "$sym updated. New reason: {$status->reason}\n";
        }
    }
}
app()->instance('verdict.unlock', false);
