<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;
use Illuminate\Support\Facades\DB;

$screenings = AaoifiScreening::with('company')->get();
$updates = [];

foreach ($screenings as $s) {
    if ($s->business_status === 'fail') {
        $reason = is_string($s->business_reasoning) ? json_decode($s->business_reasoning, true) : $s->business_reasoning;
        $summary = $reason['summary'] ?? '';
        
        if (stripos($summary, 'permissible') !== false && stripos($summary, 'impermissible') === false && stripos($summary, 'non-permissible') === false) {
            $updates[] = $s->id;
            echo "Updating " . $s->company->symbol . "\n";
        }
    }
}

if (!empty($updates)) {
    DB::transaction(function() use ($updates) {
        foreach ($updates as $id) {
            DB::table('aaoifi_screenings')->where('id', $id)->update(['business_status' => 'pass']);
        }
    });
    echo "Updated " . count($updates) . " records to business_status='pass'.\n";
} else {
    echo "No records to update.\n";
}
