<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = App\Models\Company::where('symbol', 'JBERGER')->first();
if ($c) {
    $status = App\Models\StockStatus::where('company_id', $c->id)->first();
    if ($status) {
        $status->reason = "Permissible core activity. However, it fails the AAOIFI quantitative financial screening due to excess liquidity, with a Cash Ratio of 33.95% (exceeding the 30.00% limit).";
        $status->save();
        echo "Updated JBERGER Reason!\n";
    }
}
