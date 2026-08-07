<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tickers = ['AFROMEDIA', 'BETAGLAS', 'CILEASING', 'DAARCOMM', 'HMCALL', 'NAHCO', 'NCR', 'NGXGROUP', 'SFSREIT', 'TANTALIZER', 'TRANSCORP', 'UHOMREIT', 'UPDCREIT', 'NEWGOLD', 'VETGOODS', 'VETINDETF', 'MERGROWTH', 'MERVALUE'];

$stocks = \App\Models\Stock::whereIn('ticker', $tickers)->get(['ticker', 'final_status', 'shariah_status_rationale']);

foreach ($stocks as $stock) {
    echo $stock->ticker . " | " . $stock->final_status . " | " . $stock->shariah_status_rationale . "\n";
}
