<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;

$symbols = ['CILEASING', 'NAHCO', 'NGXGROUP', 'TRANSCORP', 'TANTALIZER', 'AFROMEDIA', 'SFSREIT', 'JOHNHOLT', 'SCOA', 'DAARCOMM', 'NCR', 'HMCALL', 'ZICHIS'];

$companies = Company::whereIn('symbol', $symbols)->with('status')->get();

foreach ($companies as $c) {
    echo "{$c->symbol} ({$c->status->status ?? 'none'}):\n";
    echo "Reason: {$c->status->reason ?? 'none'}\n\n";
}
