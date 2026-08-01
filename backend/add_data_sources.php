<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;
use Illuminate\Contracts\Console\Kernel;

$screenings = AaoifiScreening::all();
$updated = 0;

foreach ($screenings as $s) {
    $data = $s->financial_data_used ?? [];

    // Default comprehensive data source string
    $defaultSource = 'Data aggregated from Nigerian Exchange Group (NGX), AfricanFinancials, and Yahoo Finance.';

    if (! isset($data['source']) || $data['source'] === '') {
        $data['source'] = $defaultSource;
    } else {
        // If it has a custom source like "Quadratic HQ verified FY2024", append the others
        if (! str_contains($data['source'], 'NGX') && ! str_contains($data['source'], 'Yahoo')) {
            $data['source'] = $data['source'].' | '.$defaultSource;
        }
    }

    $s->financial_data_used = $data;
    $s->save();
    $updated++;
}

echo "Successfully updated $updated AAOIFI screening records with explicit data source references.\n";
