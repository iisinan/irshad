<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;

$screenings = AaoifiScreening::with('company')->get();
$mismatches = [];

foreach ($screenings as $s) {
    if ($s->business_status === 'fail') {
        $reason = is_string($s->business_reasoning) ? json_decode($s->business_reasoning, true) : $s->business_reasoning;
        $summary = $reason['summary'] ?? '';
        
        if (stripos($summary, 'permissible') !== false && stripos($summary, 'impermissible') === false && stripos($summary, 'non-permissible') === false) {
            $mismatches[] = $s->company->symbol;
        }
    }
}

echo "Mismatches: " . implode(', ', $mismatches) . "\n";
