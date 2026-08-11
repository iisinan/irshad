<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\StockStatus;

$c = Company::where('symbol', 'CADBURY')->with('aaoifiScreening')->first();
if ($c) {
    echo "CADBURY Status: {$c->current_status}\n";
    $status = StockStatus::where('company_id', $c->id)->first();
    if ($status) {
        echo "Reason: {$status->reason}\n";
    } else {
        echo "Reason: [No StockStatus record found]\n";
    }
    
    if ($c->aaoifiScreening) {
        $a = $c->aaoifiScreening;
        echo "Debt: {$a->debt_ratio}% ({$a->debt_status})\n";
        echo "Cash: {$a->cash_ratio}% ({$a->cash_status})\n";
        echo "Income: {$a->impermissible_income_ratio}% ({$a->impermissible_income_status})\n";
        echo "Business Reasoning: " . json_encode($a->business_reasoning) . "\n";
    }
} else {
    echo "CADBURY not found.\n";
}
