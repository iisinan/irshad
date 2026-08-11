<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;
use App\Models\StockStatus;

$company = Company::where('symbol', 'NAHCO')->first();
if ($company) {
    $company->business_reasoning = 'Core aviation ground/cargo/passenger handling and logistics lines (NAHCO FTZ, Commodities, Logistics, Power Solutions, Aviation Academy) are clean fee-for-service businesses. However, NAHCO Travel and Hospitality Limited (NHTL) now directly operates Sapphire Hotel, a 20-room in-terminal hotel at MMIA Terminal II (opened Feb 2026), with an on-site restaurant/lounge. No alcohol service confirmed either way in public disclosures - amenities described (breakfast, lunch/dinner, business office, gym, prayer area) suggest a business-transit orientation, but F&B/bar revenue at the hotel needs direct confirmation before treating as fully clean. Not comparable to Ikeja Hotel (no casino/nightclub indicated).';
    $company->save();
    
    $statusRecord = StockStatus::where('company_id', $company->id)->first();
    if ($statusRecord) {
        $statusRecord->reason = null;
        $statusRecord->save();
        echo "Fixed NAHCO: reason cleared, business_reasoning populated\n";
    }
}
