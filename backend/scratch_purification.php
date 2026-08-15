<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$companies = \App\Models\Company::with('aaoifiScreening')->whereIn('current_status', ['halal', 'compliant'])->get();
$purificationStocks = [];
foreach($companies as $company) {
    if ($company->aaoifiScreening && $company->aaoifiScreening->impermissible_income_ratio > 0) {
        $purificationStocks[] = [
            'symbol' => $company->symbol,
            'name' => $company->company_name,
            'ratio' => $company->aaoifiScreening->impermissible_income_ratio
        ];
    }
}
echo json_encode($purificationStocks, JSON_PRETTY_PRINT);
