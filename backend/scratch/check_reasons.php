<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$names = [
    'JOHN HOLT',
    'NIGERIAN AVIATION',
    'S C O A',
    'HONEYWELL',
    'HONYFLOUR'
];

foreach ($names as $name) {
    $company = \App\Models\Company::where('name', 'iLIKE', "%{$name}%")->first();
        
    if ($company) {
        $screening = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();
        $status = \App\Models\StockStatus::where('company_id', $company->id)->first();
        
        echo "=====================================\n";
        echo "Company: " . $company->name . "\n";
        
        if ($screening) {
            echo "AaoifiScreening Status: " . $screening->business_status . "\n";
            $reasoning = json_decode($screening->business_reasoning, true);
            echo "AaoifiScreening Reason: " . ($reasoning['summary'] ?? $screening->business_reasoning) . "\n";
        } else {
            echo "No AaoifiScreening found.\n";
        }
        
        if ($status) {
            echo "StockStatus Status: " . $status->status . "\n";
            echo "StockStatus Reason: " . $status->reason . "\n";
        }
    } else {
        echo "=====================================\n";
        echo "Could not find company matching: {$name}\n";
    }
}
