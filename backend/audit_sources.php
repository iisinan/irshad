<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$companies = \App\Models\Company::with(['financials', 'aaoifiScreening'])->get();

$fromNgxPdf = [];
$fromOtherUrl = [];
$initialSeederOrExcel = [];
$noFinancialsAtAll = [];

foreach ($companies as $c) {
    $fin = $c->financials->sortByDesc('id')->first();
    $sourceUrl = $fin ? $fin->source_url : null;
    
    if ($sourceUrl) {
        if (str_contains($sourceUrl, 'ngxgroup.com') || str_contains($sourceUrl, 'ngxpulse.ng')) {
            $fromNgxPdf[] = [
                'symbol' => $c->symbol,
                'name' => $c->name,
                'url' => $sourceUrl,
                'period' => $fin->reporting_period
            ];
        } else {
            $fromOtherUrl[] = [
                'symbol' => $c->symbol,
                'name' => $c->name,
                'url' => $sourceUrl,
                'period' => $fin->reporting_period
            ];
        }
    } else {
        $hasData = $fin && ($fin->total_assets > 0 || $fin->total_revenue > 0 || $fin->total_debt > 0);
        if ($hasData) {
            $initialSeederOrExcel[] = [
                'symbol' => $c->symbol,
                'name' => $c->name,
                'total_assets' => $fin->total_assets,
                'debt' => $fin->total_debt,
                'revenue' => $fin->total_revenue,
                'period' => $fin->reporting_period,
            ];
        } else {
            $noFinancialsAtAll[] = [
                'symbol' => $c->symbol,
                'name' => $c->name,
            ];
        }
    }
}

echo "=======================================================\n";
echo "FINANCIAL DATA SOURCE BREAKDOWN\n";
echo "=======================================================\n";
echo "1. Official NGX / NGXPulse PDF Filings (doclib.ngxgroup.com / ngxpulse.ng): " . count($fromNgxPdf) . " companies\n";
echo "2. Other External URLs: " . count($fromOtherUrl) . " companies\n";
echo "3. Historical Seed / Excel Import (No source_url, from initial NGX Excel / database seed): " . count($initialSeederOrExcel) . " companies\n";
echo "4. No Financial Records (0 / Empty): " . count($noFinancialsAtAll) . " companies\n";
echo "Total Companies: " . $companies->count() . "\n\n";

if (!empty($fromOtherUrl)) {
    echo "--- OTHER EXTERNAL URLS ---\n";
    foreach ($fromOtherUrl as $item) {
        echo "- {$item['symbol']}: {$item['url']} ({$item['period']})\n";
    }
    echo "\n";
}

echo "--- 1. OFFICIAL NGX PDF DISCLOSURES (" . count($fromNgxPdf) . ") ---\n";
foreach ($fromNgxPdf as $item) {
    echo "- {$item['symbol']} ({$item['name']}): {$item['url']}\n";
}

echo "\n--- 3. INITIAL SEED / EXCEL IMPORT (NO PDF SOURCE URL) (" . count($initialSeederOrExcel) . ") ---\n";
foreach ($initialSeederOrExcel as $item) {
    echo "- {$item['symbol']}: Assets=" . number_format($item['total_assets']) . ", Debt=" . number_format($item['debt']) . ", Rev=" . number_format($item['revenue']) . " (Period: " . ($item['period'] ?: 'N/A') . ")\n";
}
