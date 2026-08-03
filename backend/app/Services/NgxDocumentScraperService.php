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
     * Uses the official NGX SharePoint REST API.
     *
     * @param  string  $ticker  The stock ticker symbol (e.g., MTNN)
     * @return string|null The direct URL to the PDF, or null if not found
     */
    /**
     * Find the latest financial statement PDF URL for a given NGX ticker.
     *
     * Step 1 – NGX SharePoint API (fast, structured):
     *   Queries the official doclib.ngxgroup.com SharePoint REST API filtered
     *   to Type_of_Submission = 'Financial Statements'. This is the preferred
     *   route as it is low-latency and requires no browser automation.
     *
     * Step 2 – NGXPulse Apify fallback (when Step 1 finds nothing):
     *   Falls back to scraping https://ngxpulse.ng/disclosures via a cloud
     *   Puppeteer browser (Apify). The page is rendered fully including all
     *   AJAX content, then all document links are harvested and scored to
     *   identify the best matching financial statement PDF.
     *
     * @param  string  $ticker  NGX stock ticker (e.g. AIRTELAFRI)
     * @return string|null      Direct URL to the latest financial PDF, or null
     */
    public function findLatestFinancialReportPdfUrl(string $ticker): ?string
    {
        // ---------------------------------------------------------------
        // STEP 1: NGX SharePoint API (primary source)
        // ---------------------------------------------------------------
        $pdfUrl = $this->findViaSharePointApi($ticker);

        if ($pdfUrl) {
            return $pdfUrl;
        }

        // ---------------------------------------------------------------
        // STEP 2: NGXPulse.ng/disclosures via Apify (fallback)
        // ---------------------------------------------------------------
        Log::info("[{$ticker}] NGX SharePoint API returned nothing. Trying NGXPulse Apify fallback...");

        return $this->fallback->findLatestFinancialPdfUrl($ticker);
    }

    /**
     * Query the official NGX SharePoint REST API for the latest financial
     * statement PDF. Returns null if not found or on any error.
     */
    private function findViaSharePointApi(string $ticker): ?string
    {
        Log::info("[{$ticker}] Querying NGX SharePoint API for financial PDF...");

        $url = "https://doclib.ngxgroup.com/_api/Web/Lists/GetByTitle('XFinancial_News')/items";

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json;odata=verbose',
            ])->retry(3, 5000, function ($exception, $request) use ($ticker) {
                Log::warning("Retrying NGX API request for {$ticker} due to: ".$exception->getMessage());

                return $exception instanceof ConnectionException || $exception->getCode() >= 500;
            })->timeout(15)->get($url, [
                '$select'  => 'URL,Modified,Created,CompanyName,CompanySymbol,InternationSecIN,Type_of_Submission',
                '$orderby' => 'Created desc',
                '$filter'  => "CompanySymbol eq '{$ticker}' and (Type_of_Submission eq 'Financial Statements' or Type_of_Submission eq 'Audited Financial Statements' or Type_of_Submission eq 'Unaudited Financial Statements')",
                '$Top'     => 1,
            ]);

            if (! $response->successful()) {
                Log::error("[{$ticker}] NGX SharePoint API failed. HTTP ".$response->status());

                return null;
            }

            $results = $response->json('d.results') ?? [];

            if (! empty($results)) {
                $pdfUrl = $results[0]['URL']['Url'] ?? null;

                if ($pdfUrl) {
                    Log::info("[{$ticker}] Found PDF via NGX SharePoint API: {$pdfUrl}");

                    return $pdfUrl;
                }
            }

        } catch (\Exception $e) {
            Log::error("[{$ticker}] Exception querying NGX SharePoint API: ".$e->getMessage());
        }

        Log::info("[{$ticker}] NGX SharePoint API returned no results.");

        return null;
    }
}
