<?php
use App\Models\Company;

$companies = Company::all();
$missingLogs = [];

foreach($companies as $c) {
    $missing = [];
    if (empty($c->logo_url)) $missing[] = 'Logo';
    if (empty($c->overview)) $missing[] = 'Overview';
    if (empty($c->sector) || $c->sector === 'Unknown') $missing[] = 'Sector';
    if ($c->latest_price <= 0) $missing[] = 'Price';
    
    // Check if it has financials
    $hasFinancials = \App\Models\Financial::where('company_id', $c->id)->exists();
    if (!$hasFinancials) $missing[] = 'Financials';

    if (!empty($missing)) {
        $missingLogs[] = $c->symbol . ' is missing: ' . implode(', ', $missing);
    }
}

echo "Found " . count($missingLogs) . " companies with missing data.\n";
if (count($missingLogs) > 0) {
    // Only print first 20 to avoid giant walls of text
    echo "Here are some of them:\n";
    foreach (array_slice($missingLogs, 0, 20) as $log) {
        echo "- " . $log . "\n";
    }
    if (count($missingLogs) > 20) {
        echo "... and " . (count($missingLogs) - 20) . " more.\n";
    }
}
