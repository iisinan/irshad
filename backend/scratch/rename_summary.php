<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\AaoifiScreening;

$screenings = AaoifiScreening::all();
$count = 0;
foreach ($screenings as $s) {
    $reason = $s->business_reasoning;
    if (is_array($reason) && isset($reason['summary'])) {
        $reason['reasoning'] = $reason['summary'];
        unset($reason['summary']);
        $s->business_reasoning = $reason;
        $s->save();
        $count++;
    }
}
echo "Updated $count screenings.\n";
