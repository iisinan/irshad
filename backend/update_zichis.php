<?php
$companyId = 235;
$screening = App\Models\AaoifiScreening::where('company_id', $companyId)->first();
if (!$screening) {
    echo "Screening not found for company $companyId\n";
} else {
    $screening->business_status = 'fail';
    $screening->final_status = 'non-compliant';
    $reasoning = is_array($screening->business_reasoning) ? $screening->business_reasoning : json_decode($screening->business_reasoning, true) ?? [];
    $reasoning['summary'] = "The majority of the company's operations—such as oil palm, poultry, fish, crop, and snail farming—are permissible. However, official disclosures on the NGX explicitly identify piggery among its business operations. Because swine farming violates core Shariah principles, it acts as a categorical exclusion, resulting in a non-compliant status irrespective of the percentage of revenue it contributes.";
    $screening->business_reasoning = $reasoning;
    $screening->save();
    echo "Updated aaoifi_screenings.\n";
}

$stockStatus = App\Models\StockStatus::where('company_id', $companyId)->first();
if ($stockStatus) {
    $stockStatus->status = 'non-compliant';
    $stockStatus->save();
    echo "Updated stock_statuses.\n";
} else {
    App\Models\StockStatus::create(['company_id' => $companyId, 'status' => 'non-compliant']);
    echo "Created stock_statuses.\n";
}
