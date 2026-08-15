<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$overrides = \App\Models\StockStatus::with('company')
    ->where('reason', 'iLIKE', '%Scholar Override%')
    ->orWhere('verified_by_scholar', true)
    ->get();

$list = [];
foreach ($overrides as $status) {
    if ($status->company) {
        $list[] = [
            'ticker' => $status->company->ticker ?? 'N/A',
            'name' => $status->company->name ?? 'N/A',
            'status' => $status->status,
            'reason' => $status->reason
        ];
    }
}

echo "Found " . count($list) . " stocks with a Scholar Override.\n\n";

foreach ($list as $item) {
    echo "- **{$item['name']}** ({$item['ticker']})\n";
    echo "  - **Status:** {$item['status']}\n";
    echo "  - **Justification:** {$item['reason']}\n\n";
}
