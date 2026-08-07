<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$company = \App\Models\Company::where('symbol', 'ETRANZACT')->first();
if ($company) {
    $newReason = "The company achieves full Shariah compliance as its core business of payment technology services is deemed a permissible activity, provided no interest-bearing float structures are utilized. Furthermore, it easily satisfies all quantitative financial benchmarks, recording a negligible debt ratio of 0.08%, a cash ratio of 17.76%, and an impermissible income ratio of 3.33% (which falls below the 5% threshold but requires purification).";
    
    $company->activity_reason = $newReason;
    $company->save();
    
    $stockStatus = \App\Models\StockStatus::where('company_id', $company->id)->first();
    if ($stockStatus) {
        $stockStatus->reason = $newReason;
        $stockStatus->save();
        echo "Updated StockStatus for ETRANZACT\n";
    } else {
        echo "No StockStatus found for ETRANZACT\n";
    }
} else {
    echo "ETRANZACT not found.\n";
}
