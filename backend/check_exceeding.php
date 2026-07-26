<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;

$screenings = AaoifiScreening::with('company')->get();

$exceeding = [];

foreach ($screenings as $s) {
    $hasExceeding = false;
    $details = [];
    
    if ($s->debt_ratio > 100) {
        $hasExceeding = true;
        $details['debt_ratio'] = $s->debt_ratio;
    }
    if ($s->cash_ratio > 100) {
        $hasExceeding = true;
        $details['cash_ratio'] = $s->cash_ratio;
    }
    if ($s->impermissible_income_ratio > 100) {
        $hasExceeding = true;
        $details['impermissible_income_ratio'] = $s->impermissible_income_ratio;
    }
    if ($s->illiquid_ratio > 100) {
        $hasExceeding = true;
        $details['illiquid_ratio'] = $s->illiquid_ratio;
    }
    if ($s->receivables_ratio > 100) {
        $hasExceeding = true;
        $details['receivables_ratio'] = $s->receivables_ratio;
    }
    
    if ($hasExceeding) {
        $exceeding[] = [
            'symbol' => $s->company ? $s->company->symbol : 'Unknown',
            'details' => $details,
            'financial_data' => $s->financial_data_used
        ];
    }
}

echo json_encode($exceeding, JSON_PRETTY_PRINT);
