<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;

$screenings = AaoifiScreening::where('business_status', 'doubtful')->with('company')->get();

$fixed = 0;
foreach ($screenings as $aaoifi) {
    $c = $aaoifi->company;
    if (!$c) continue;

    // Check financial passes
    $financial_pass = ($aaoifi->debt_status === 'pass' && $aaoifi->cash_status === 'pass' && $aaoifi->impermissible_income_status === 'pass');

    // If it passes financials, it stays doubtful. If it fails, it becomes non-halal.
    $new_final = $financial_pass ? 'doubtful' : 'non-halal';

    $aaoifi->final_status = $new_final;
    $aaoifi->save();

    // Ensure the company matches
    if ($c->current_status !== $new_final) {
        $c->current_status = $new_final;
        $c->save();
    }
    
    // Ensure the StockStatus matches (if non-halal, it should be non-halal. If doubtful, doubtful)
    $status = App\Models\StockStatus::where('company_id', $c->id)->first();
    if ($status && $status->status !== $new_final) {
        $status->status = $new_final;
        $status->save();
    }
    
    $fixed++;
    echo "Fixed {$c->symbol}: final_status now {$new_final}\n";
}

echo "Total doubtful stocks synced: {$fixed}\n";
