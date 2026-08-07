<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;

$companies = Company::whereIn('symbol', ['DANGCEM', 'PZ', 'AIRTELAFRI'])->get();

foreach ($companies as $company) {
    $proposal = \DB::table('financial_update_proposals')
        ->where('company_id', $company->id)
        ->where('status', 'pending')
        ->orderBy('created_at', 'desc')
        ->first();
        
    if ($proposal) {
        app(\App\Services\FinancialUpdateService::class)->approveUpdate($proposal->id, 1); // Admin ID 1
        echo "Approved proposal for {$company->symbol}\n";
    } else {
        echo "No pending proposals for {$company->symbol}\n";
    }
}
