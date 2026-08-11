<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$etfs = ['NEWGOLD', 'STANBICETF30', 'VETBANK', 'VETGRIF30', 'VETGOODS', 'VETINDETF', 'VSPBONDETF', 'LOTUSHAL15', 'MERGROWTH', 'MERVALUE', 'SIAMLETF40', 'GREENWETF'];

$missing = [];
$found = [];

foreach ($etfs as $symbol) {
    $c = App\Models\Company::where('symbol', $symbol)->first();
    if ($c) {
        $found[] = $symbol;
    } else {
        $missing[] = $symbol;
    }
}

echo "Found in DB: " . count($found) . "\n";
echo "Missing in DB: " . count($missing) . "\n";
if (count($missing) > 0) {
    echo "Missing symbols: " . implode(", ", $missing) . "\n";
}
