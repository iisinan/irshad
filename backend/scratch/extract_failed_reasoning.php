<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;

$screenings = AaoifiScreening::with('company')->where('business_status', 'fail')->get();
$data = [];

foreach ($screenings as $s) {
    if (!$s->company) continue;
    $reasonRaw = $s->business_reasoning;
    $reason = is_string($reasonRaw) ? json_decode($reasonRaw, true) : $reasonRaw;
    $summary = $reason['summary'] ?? (is_string($reasonRaw) ? $reasonRaw : '');
    
    $data[$s->company->symbol] = $summary;
}

file_put_contents('/Users/sinan/Herd/irshad/backend/scratch/fails_reasoning.json', json_encode($data, JSON_PRETTY_PRINT));
echo "Extracted reasoning for " . count($data) . " failed companies.\n";
