<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$symbols = [
    'AFROMEDIA', 'BETAGLAS', 'CILEASING', 'DAARCOMM', 'HMCALL', 'NCR', 
    'NGXGROUP', 'SFSREIT', 'TANTALIZER', 'TRANSCORP', 'UHOMREIT', 'UPDCREIT',
    'NEWGOLD', 'VETGOODS', 'VETINDETF', 'MERGROWTH', 'MERVALUE'
];

$count = 0;
foreach ($symbols as $symbol) {
    $company = App\Models\Company::where('symbol', $symbol)->first();
    if ($company) {
        $company->update(['current_status' => 'doubtful']);
        Illuminate\Support\Facades\DB::table('stock_statuses')->updateOrInsert(
            ['company_id' => $company->id],
            [
                'status' => 'doubtful', 
                'reason' => 'Manually classified as doubtful per scholar override.', 
                'verified_by_scholar' => true, 
                'last_updated' => now(), 
                'updated_at' => now()
            ]
        );
        Illuminate\Support\Facades\Cache::forget('stocks.show.' . $symbol);
        Illuminate\Support\Facades\Cache::forget('stocks.show.' . $symbol . '_v2');
        $count++;
    } else {
        echo "Warning: Company $symbol not found.\n";
    }
}
// Remove the cache tags flush to avoid the BadMethodCallException
// Illuminate\Support\Facades\Cache::tags(['stocks'])->flush();

echo "Updated $count doubtful stocks.\n";
