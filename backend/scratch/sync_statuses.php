<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\AaoifiScreening;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

app()->instance('verdict.unlock', true);

$screenings = AaoifiScreening::with('company')->get();
$count = 0;

foreach ($screenings as $screening) {
    if ($screening->company) {
        $screening->company->current_status = $screening->final_status;
        $screening->company->save();
        $count++;
        echo "Updated {$screening->company->symbol} to {$screening->final_status}\n";
    }
}

try {
    Artisan::call('cache:clear');
} catch (\Exception $e) {
    echo "Cache clear failed: " . $e->getMessage() . "\n";
}

echo "Synced $count companies.\n";
