<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Company;
use App\Jobs\ProcessCompanyFinancialsJob;

$updates = [
    'AIRTELAFRI' => 'https://doclib.ngxgroup.com/Financial_NewsDocs/47526_AIRTEL_AFRICA_PLC-THREE_MONTHS_RESULTS_FOR_PERIOD_ENDED_30_JUNE_2026_CORPORATE_ACTIONS_JULY_2026.pdf',
    'DANGCEM'    => 'https://doclib.ngxgroup.com/Financial_NewsDocs/47629_DANGOTE_CEMENT_PLC-H1_2026_EARNINGS_RELEASE_CORPORATE_ACTIONS_JULY_2026.pdf',
    'PZ'         => 'https://doclib.ngxgroup.com/Financial_NewsDocs/47374_P_Z_CUSSONS_NIGERIA_PLC.-Q4_2026_FINANCIAL_YEAR_EARNINGS_RESULT_CORPORATE_ACTIONS_JULY_2026.pdf'
];

foreach ($updates as $symbol => $url) {
    echo "Processing {$symbol} with URL: {$url}\n";
    $company = Company::where('symbol', $symbol)->first();
    if (!$company) {
        echo "Company $symbol not found.\n";
        continue;
    }
    
    // Clear lock just in case it was stuck
    \Illuminate\Support\Facades\Cache::lock("financial_discovery_{$symbol}", 300)->forceRelease();
    
    // We instantiate the job and run it manually
    $job = new ProcessCompanyFinancialsJob($company, $url);
    try {
        $job->handle(
            app(\App\Services\NgxDocumentScraperService::class),
            app(\App\Services\AiDocumentParserService::class),
            app(\App\Services\AaoifiComplianceService::class)
        );
        echo "Successfully handled $symbol.\n";
    } catch (\Exception $e) {
        echo "Error processing $symbol: " . $e->getMessage() . "\n";
    }
}
echo "Done processing all.\n";
