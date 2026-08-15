<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\StockStatus;
use App\Models\AaoifiScreening;
use App\Models\Company;

$doubtfuls = StockStatus::where('status', 'doubtful')->get();
$count = 0;

foreach ($doubtfuls as $statusRecord) {
    $company = Company::find($statusRecord->company_id);
    $screening = AaoifiScreening::where('company_id', $company->id)->first();
    
    if ($screening && !empty($screening->business_reasoning)) {
        $raw = json_decode($screening->business_reasoning, true) ?? $screening->business_reasoning;
        $text = '';
        if (is_array($raw)) {
            $text = $raw['summary'] ?? $raw['reasoning'] ?? $raw['reason'] ?? $raw['justification'] ?? '';
        } elseif (is_string($raw) && str_starts_with(trim($raw), '{')) {
            $decoded = json_decode($raw, true);
            $text = $decoded['summary'] ?? $decoded['reasoning'] ?? $decoded['reason'] ?? $decoded['justification'] ?? '';
        } else {
            $text = $raw;
        }

        if (!empty($text)) {
            $statusRecord->reason = $text;
            $statusRecord->save();
            echo "Updated StockStatus for {$company->symbol}\n";
            $count++;
        }
    }
}

try {
    \Illuminate\Support\Facades\Artisan::call('cache:clear');
    echo "Cleared cache.\n";
} catch (\Exception $e) {
    echo "Failed to clear cache: " . $e->getMessage() . "\n";
}

echo "Updated $count doubtful stock statuses.\n";
