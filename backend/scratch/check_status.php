<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$symbols = ['DAARCOMM', 'UPDCREIT'];
foreach ($symbols as $sym) {
    $c = Company::where('symbol', $sym)->with('aaoifiScreening')->first();
    echo "$sym:\n";
    echo "Current Status: {$c->current_status}\n";
    if ($c->aaoifiScreening) {
        $a = $c->aaoifiScreening;
        echo "Business Status: {$a->business_status}\n";
        echo "Final Status: {$a->final_status}\n";
        echo "Debt: {$a->debt_ratio}% ({$a->debt_status})\n";
        echo "Cash: {$a->cash_ratio}% ({$a->cash_status})\n";
        echo "Income: {$a->impermissible_income_ratio}% ({$a->impermissible_income_status})\n";
    }
    echo "---\n";
}
