<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Models\News;
use App\Models\AaoifiScreening;
use App\Services\AaoifiScreeningService;

$dumpFile = 'db_dump3.json';
$data = json_decode(file_get_contents($dumpFile), true);

$count = 0;
foreach ($data as $item) {
    if (empty($item['symbol'])) continue;
    
    // 1. Restore Company Metadata
    $company = Company::where('symbol', $item['symbol'])->first();
    if (!$company) {
        $company = new Company();
        $company->symbol = $item['symbol'];
    }
    
    // Fill all relevant company fields from backup
    $fields = ['name', 'sector', 'industry', 'business_type', 'description', 'overview', 'analysts_target', 'valuation_info', 'growth_info', 'div_yield', 'logo_url', 'is_sec_registered', 'latest_price', 'price_change', 'price_change_pct', 'market_cap', 'pe_ratio', 'eps', 'activity_reason', 'shares_outstanding', '52w_high', '52w_low', 'volume_today', 'is_active', 'email', 'date_listed', 'date_of_incorporation'];
    
    foreach ($fields as $field) {
        if (isset($item[$field])) {
            $company->$field = $item[$field];
        }
    }
    
    // Handle status mapping rules as requested by user
    $oldStatus = $item['current_status'] ?? 'pending';
    if ($oldStatus === 'doubtful' || $oldStatus === 'pending') {
        // If stock is missing financials, leave it with business activity screening verdict
        $businessStatus = $item['aaoifi_screening']['business_status'] ?? 'pass';
        $company->current_status = ($businessStatus === 'fail') ? 'non-compliant' : 'halal';
    } elseif ($oldStatus === 'non-halal') {
        $company->current_status = 'non-compliant';
    } else {
        $company->current_status = $oldStatus;
    }
    $company->save();

    // 2. Restore News Sources
    if (!empty($item['news_sources']) && is_array($item['news_sources'])) {
        foreach ($item['news_sources'] as $newsItem) {
            $news = News::firstOrNew([
                'company_id' => $company->id,
                'title' => $newsItem['title']
            ]);
            $news->url = $newsItem['url'] ?? null;
            $news->source = $newsItem['source'] ?? null;
            $news->thumbnail_url = $newsItem['thumbnail_url'] ?? null;
            $news->published_at = $newsItem['published_at'] ?? now();
            $news->excerpt = $newsItem['excerpt'] ?? null;
            $news->save();
        }
    }
    
    // 3. Ensure AAOIFI Screening row exists and sync business_status if missing financials
    $screeningData = $item['aaoifi_screening'] ?? null;
    if ($screeningData) {
        $screening = AaoifiScreening::firstOrNew(['company_id' => $company->id]);
        $screening->business_status = $screeningData['business_status'] ?? 'pass';
        $screening->business_reasoning = $screeningData['business_reasoning'] ?? null;
        // Don't overwrite the financial math (debt_ratio etc) since we just dynamically rebuilt it
        // Only override the final status if it violates constraints or is missing
        $finalStatus = $company->current_status ?: 'pending';
        $screening->final_status = $finalStatus;
        $screening->save();
    }
    
    $count++;
}
echo "Done! Restored full metadata and news for $count companies.\n";
