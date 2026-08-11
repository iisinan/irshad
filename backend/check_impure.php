<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$screenings = \App\Models\AaoifiScreening::with('company')
    ->where('business_status', 'pass')
    ->where('impermissible_income_ratio', '>', 5)
    ->get();

if ($screenings->isEmpty()) {
    echo "No other stocks found with this issue.\n";
} else {
    echo "Stocks with Pass Business Status but Impure Income > 5%:\n";
    foreach ($screenings as $s) {
        echo "- " . $s->company->symbol . ": " . $s->impermissible_income_ratio . "%\n";
    }
}
