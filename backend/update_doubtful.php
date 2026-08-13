<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$allowed = ['AFROMEDIA', 'BETAGLAS', 'CILEASING', 'DAARCOMM', 'HMCALL', 'MERGROWTH', 'MERVALUE', 'NCR', 'NEWGOLD', 'NGXGROUP', 'SFSREIT', 'TANTALIZER', 'TRANSCORP', 'UHOMREIT', 'UPDCREIT', 'VETGOODS', 'VETINDETF'];

$companies = App\Models\Company::where('current_status', 'doubtful')->whereNotIn('symbol', $allowed)->get();

foreach ($companies as $company) {
    $company->update(['current_status' => 'non-halal']);
    Illuminate\Support\Facades\DB::table('stock_statuses')->updateOrInsert(
        ['company_id' => $company->id],
        [
            'status' => 'non-halal', 
            'reason' => 'Fails qualitative business activity screening.', 
            'verified_by_scholar' => true, 
            'last_updated' => now(), 
            'updated_at' => now()
        ]
    );
    Illuminate\Support\Facades\Cache::forget('stocks.show.' . $company->symbol);
    Illuminate\Support\Facades\Cache::forget('stocks.show.' . $company->symbol . '_v2');
}

echo "Fixed.\n";
