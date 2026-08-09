<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$updates = [
    ['symbol' => 'JBERGER', 'from' => 'non-halal', 'to' => 'halal'],
];

foreach ($updates as $update) {
    $company = \App\Models\Company::where('symbol', $update['symbol'])->first();
    if (!$company) {
        echo "NOT FOUND: " . $update['symbol'] . "\n";
        continue;
    }
    echo "Updating {$company->symbol} ({$company->name})\n";
    echo "  Before: {$company->current_status}\n";
    $company->current_status = $update['to'];
    $company->save();
    echo "  After:  {$company->current_status}\n";
}

echo "\nDone.\n";
