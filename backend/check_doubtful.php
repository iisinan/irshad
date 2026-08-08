<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// 1. Check ETRANZACT
$et = \App\Models\Company::where('symbol', 'ETRANZACT')->first();
if($et) {
    $status = \App\Models\StockStatus::where('company_id', $et->id)->first();
    echo "ETRANZACT Status: " . ($status->status ?? 'None') . "\n";
    echo "Reason: " . ($status->reason ?? 'None') . "\n\n";
} else {
    echo "ETRANZACT not found in DB\n\n";
}

// 2. List Doubtful Stocks from DB
$doubtfulStatuses = \App\Models\StockStatus::where('status', 'doubtful')->get();
$doubtfulCompanyIds = $doubtfulStatuses->pluck('company_id');
$doubtfulCompanies = \App\Models\Company::whereIn('id', $doubtfulCompanyIds)->get()->keyBy('id');

echo "DOUBTFUL STOCKS IN DB (" . count($doubtfulStatuses) . "):\n";
$dbDoubtfulTickers = [];
foreach($doubtfulStatuses as $s) {
    if(isset($doubtfulCompanies[$s->company_id])) {
        $ticker = $doubtfulCompanies[$s->company_id]->symbol;
        $dbDoubtfulTickers[] = $ticker;
        echo "- $ticker: {$s->reason}\n";
    }
}
echo "\n";

// 3. Compare with Doubtful in Excel
$jsonPath = "/Users/sinan/.gemini/antigravity/brain/25c1a00e-0378-4af4-8f83-9101b2f63bdd/scratch/non_halal_excel.json";
// Actually I need to read the Excel directly for doubtful!
