<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NgxDocumentScraperService
{
    /**
     * Fallback service that scrapes ngxpulse.ng/disclosures via Apify
     * when the primary NGX SharePoint API returns no results.
     */
    protected NgxPulseFallbackService $fallback;

    public function __construct(NgxPulseFallbackService $fallback)
    {
        $this->fallback = $fallback;
    }

    /**
     * Find the URL to the latest quarterly or annual financial statement PDF for a given ticker.
     * EXCLUSIVELY uses ngxpulse.ng/disclosures via Apify as the sole source of truth.
     *
     * @param  string  $ticker  NGX stock ticker (e.g. AIRTELAFRI)
     * @return string|null      Direct URL to the latest financial PDF, or null
     */
    public function findLatestFinancialReportPdfUrl(string $ticker): ?string
    {
        Log::info("[{$ticker}] Searching NGXPulse.ng via Apify (Sole Source) for financial PDF...");

        return $this->fallback->findLatestFinancialPdfUrl($ticker);
    }
}
