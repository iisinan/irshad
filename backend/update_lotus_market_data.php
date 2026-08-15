<?php
$company = App\Models\Company::where('symbol', 'LOTUSHAL15')->first();
if ($company) {
    $company->latest_price = 127.95;
    $company->price_change_pct = 4.02;
    $company->volume_today = 17501;
    $company->save();

    // Also update market data if the relation exists
    $marketData = App\Models\MarketData::firstOrNew(['company_id' => $company->id]);
    $marketData->open = 123.00;
    $marketData->high = 130.00;
    $marketData->low = 122.50;
    $marketData->volume = 17501;
    $marketData->save();
    echo "Updated LOTUSHAL15 market data successfully.\n";
} else {
    echo "LOTUSHAL15 not found.\n";
}
