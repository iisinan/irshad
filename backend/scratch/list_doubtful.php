<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$doubtfulScreenings = \App\Models\AaoifiScreening::with('company')
    ->where('business_status', 'doubtful')
    ->get();

$list = [];
foreach ($doubtfulScreenings as $screening) {
    if ($screening->company) {
        $list[] = [
            'ticker' => $screening->company->ticker ?? 'N/A',
            'name' => $screening->company->name ?? 'N/A',
            'reason' => json_decode($screening->business_reasoning, true)['summary'] ?? $screening->business_reasoning
        ];
    }
}

echo "Total Doubtful Stocks: " . count($list) . "\n\n";

foreach ($list as $item) {
    echo "- **" . $item['name'] . "** (" . $item['ticker'] . ")\n";
}
