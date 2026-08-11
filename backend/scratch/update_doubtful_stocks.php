<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Models\StockStatus;
use Illuminate\Support\Facades\Artisan;

$tickers = [
    'AFROMEDIA', 'BETAGLAS', 'CILEASING', 'DAARCOMM', 'HMCALL',
    'MERGROWTH', 'MERVALUE', 'NAHCO', 'NCR', 'NEWGOLD',
    'NGXGROUP', 'SFSREIT', 'TANTALIZER', 'TRANSCORP', 'UHOMREIT',
    'UPDCREIT', 'VETGOODS', 'VETINDETF'
];

foreach ($tickers as $symbol) {
    $company = Company::where('symbol', $symbol)->first();
    if ($company) {
        $company->update(['current_status' => 'doubtful']);
        
        StockStatus::updateOrCreate(
            ['company_id' => $company->id],
            [
                'status' => 'doubtful',
                'reason' => 'Business Activity Screen is Doubtful. Requires manual scholar verification.',
                'verified_by_scholar' => true,
                'last_updated' => now(),
            ]
        );
        echo "Updated {$symbol} to doubtful (scholar locked).\n";
    } else {
        echo "Company {$symbol} not found.\n";
    }
}

Artisan::call('cache:clear');
echo "Cache cleared.\n";

