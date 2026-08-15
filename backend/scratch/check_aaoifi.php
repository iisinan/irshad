<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$names = [
    'JOHN HOLT',
    'NIGERIAN AVIATION',
    'S C O A',
    'HONEYWELL'
];

foreach ($names as $name) {
    $company = \App\Models\Company::where('name', 'iLIKE', "%{$name}%")->first();
        
    if ($company) {
        $screening = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();
        
        echo "=====================================\n";
        echo "**Company:** " . $company->name . " (" . $company->ticker . ")\n";
        
        if ($screening) {
            echo "- **Business Status:** " . $screening->business_status . "\n";
            echo "- **Financial Status:** " . $screening->financial_status . "\n";
            echo "- **Overall AAOIFI Verdict:** " . $screening->overall_status . "\n";
            echo "\n**Financial Ratios:**\n";
            echo "- Debt Ratio (Limit 30%): " . number_format($screening->debt_ratio, 2) . "%\n";
            echo "- Interest-bearing Securities Ratio (Limit 30%): " . number_format($screening->interest_bearing_securities_ratio, 2) . "%\n";
            echo "- Impermissible Income Ratio (Limit 5%): " . number_format($screening->impermissible_income_ratio, 2) . "%\n";
        } else {
            echo "No AaoifiScreening found.\n";
        }
    }
}
