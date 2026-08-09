<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$scrs = \App\Models\AaoifiScreening::limit(5)->get();
foreach ($scrs as $scr) {
  echo "business_reasoning: " . json_encode($scr->business_reasoning) . "\n";
}
