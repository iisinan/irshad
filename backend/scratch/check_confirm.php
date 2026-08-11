<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$symbols = ['HONYFLOUR', 'JBERGER', 'DANGCEM', 'JAIZBANK'];
foreach ($symbols as $sym) {
    $c = Company::where('symbol', $sym)->with('aaoifiScreening')->first();
    if ($c) {
        $a = $c->aaoifiScreening;
        echo "$sym -> Status: {$c->current_status}\n";
        if ($a) {
            echo "   Debt: {$a->debt_ratio}% (Status: {$a->debt_status})\n";
            echo "   Cash: {$a->cash_ratio}% (Status: {$a->cash_status})\n";
            echo "   Income: {$a->impermissible_income_ratio}% (Status: {$a->impermissible_income_status})\n";
        }
    }
}
