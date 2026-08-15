<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$data = json_decode(file_get_contents('/tmp/aaoifi_updates.json'), true);

$updated = 0;
foreach ($data as $row) {
    $company = \App\Models\Company::where('symbol', $row['symbol'])->first();
    if ($company) {
        $screening = \App\Models\AaoifiScreening::where('company_id', $company->id)->first();
        if ($screening) {
            $screening->business_reasoning = $row['business_reasoning'];
            $screening->save();
            $updated++;
        }
    }
}

echo "Successfully updated {$updated} companies.\n";
