<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = App\Models\Company::where('symbol', 'LEGENDINT')->first();
$s = App\Models\AaoifiScreening::where('company_id', $c->id)->first();
echo 'Stored Debt Ratio: ' . $s->debt_ratio . "%\n";
echo 'Stored Cash Ratio: ' . $s->cash_ratio . "%\n";
