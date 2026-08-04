<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$companies = \App\Models\Company::whereHas('status', function ($query) {
    $query->whereIn('status', ['non-halal', 'non-compliant']);
})->with(['aaoifiScreening'])->get();

$affected = [];
foreach ($companies as $company) {
    if ($company->aaoifiScreening && $company->aaoifiScreening->business_status === 'pass') {
        $affected[] = $company->symbol . ' - ' . ($company->industry ?? $company->sector ?? 'Unknown');
    }
}
echo json_encode($affected, JSON_PRETTY_PRINT);
