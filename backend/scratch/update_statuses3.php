<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$updates = [
    'JOHN HOLT' => ['status' => 'halal', 'reason' => 'Scholar Override: Passes AAOIFI financial limits.'],
    'S C O A' => ['status' => 'non-halal', 'reason' => 'Scholar Override: Fails AAOIFI financial limits (Debt 57.78%, Impermissible Income 5.48%).'],
    'HONEYWELL' => ['status' => 'non-halal', 'reason' => 'Scholar Override: Fails AAOIFI financial limits (Debt 30.07% > 30%).'],
    'NIGERIAN AVIATION' => ['status' => 'halal', 'reason' => 'Scholar Override: Passes AAOIFI financial limits.']
];

foreach ($updates as $name => $data) {
    $company = \App\Models\Company::where('name', 'iLIKE', "%{$name}%")->first();
    if ($company) {
        $status = \App\Models\StockStatus::firstOrNew(['company_id' => $company->id]);
        $status->status = $data['status'];
        $status->reason = $data['reason'];
        $status->verified_by_scholar = true;
        $status->save();
        
        echo "Updated {$company->name} to {$data['status']}\n";
    }
}
