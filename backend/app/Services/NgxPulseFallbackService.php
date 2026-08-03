<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * NgxPulseFallbackService
 * -----------------------
 * Falls back to scraping https://ngxpulse.ng/disclosures via the Apify
 * Puppeteer Scraper actor when the primary NGX SharePoint API returns
 * no results for a given ticker.
 *
 * Financial-statement keywords we look for in document titles:
 *   - financial statement(s)
 *   - audited financial
 *   - annual report
 *   - quarterly result(s)
 *   - half year result(s)
 *   - nine months result(s)
 *   - unaudited financial
 *
 * Only links whose URL contains '.pdf' or 'doclib.ngxgroup.com' are
 * considered as they are the authoritative NGX document store.
 */
class NgxPulseFallbackService
{
    /**
     * Keywords that identify a financial-statement document.
     * Checked case-insensitively against the link text / title.
     */
    private const FINANCIAL_KEYWORDS = [
        'financial statement',
        'financial statements',
        'audited financial',
        'unaudited financial',
        'annual report',
        'quarterly result',
        'quarterly results',
        'half year result',
        'nine months result',
        'interim result',
    ];

    /**
     * Find the most recent financial statement PDF for a ticker on
     * https://ngxpulse.ng/disclosures using Apify Puppeteer Scraper.
     *
     * @param  string  $ticker  NGX ticker symbol (e.g. AIRTELAFRI)
     * @return string|null      Direct PDF URL or null if not found
     */
    public function findLatestFinancialPdfUrl(string $ticker): ?string
    {
        $apifyToken = config('services.apify.token');

        if (empty($apifyToken)) {
            Log::warning("NgxPulseFallbackService: APIFY_TOKEN is not configured. Cannot run fallback for {$ticker}.");

            return null;
        }

        Log::info("NgxPulseFallbackService: Starting Apify fallback for {$ticker} on ngxpulse.ng/disclosures");

        $disclosuresUrl = 'https://ngxpulse.ng/disclosures';

        // JavaScript page function injected into the Apify Puppeteer actor.
        // It waits for JS to render, then harvests all anchor tags.
        $pageFunction = <<<'JS'
async ({ page, request }) => {
    // Wait for the page content to be fully rendered (AJAX-heavy)
    await new Promise(r => setTimeout(r, 5000));

    // Collect every anchor on the page
    const links = await page.$$eval('a', els =>
        els.map(a => ({
            text: (a.innerText || a.textContent || '').trim(),
            url: a.href,
        }))
    );

    return { links };
}
JS;

        $runInput = [
            'startUrls'          => [['url' => $disclosuresUrl]],
            'pageFunction'       => $pageFunction,
            'proxyConfiguration' => ['useApifyProxy' => true],
        ];

        try {
            // Start the Apify actor run
            $startResponse = Http::withToken($apifyToken)
                ->timeout(30)
                ->post('https://api.apify.com/v2/acts/apify~puppeteer-scraper/runs', $runInput);

            if (! $startResponse->successful()) {
                Log::error("NgxPulseFallbackService: Failed to start Apify actor for {$ticker}. Status: ".$startResponse->status());

                return null;
            }

            $runId = $startResponse->json('data.id');

            if (! $runId) {
                Log::error("NgxPulseFallbackService: Apify did not return a run ID for {$ticker}.");

                return null;
            }

            // Poll until the run finishes (max 3 minutes)
            $maxWaitSeconds = 180;
            $pollInterval   = 5;
            $elapsed        = 0;
            $status         = 'RUNNING';

            while ($elapsed < $maxWaitSeconds && in_array($status, ['RUNNING', 'READY', 'ABORTING'])) {
                sleep($pollInterval);
                $elapsed += $pollInterval;

                $statusResponse = Http::withToken($apifyToken)
                    ->timeout(15)
                    ->get("https://api.apify.com/v2/actor-runs/{$runId}");

                $status = $statusResponse->json('data.status') ?? 'UNKNOWN';
                Log::debug("NgxPulseFallbackService: Apify run {$runId} status = {$status} ({$elapsed}s)");
            }

            if ($status !== 'SUCCEEDED') {
                Log::warning("NgxPulseFallbackService: Apify run did not SUCCEED for {$ticker}. Final status: {$status}");

                return null;
            }

            // Fetch results from the default dataset
            $datasetId       = $startResponse->json('data.defaultDatasetId');
            $resultsResponse = Http::withToken($apifyToken)
                ->timeout(30)
                ->get("https://api.apify.com/v2/datasets/{$datasetId}/items");

            if (! $resultsResponse->successful()) {
                Log::error("NgxPulseFallbackService: Failed to fetch Apify dataset for {$ticker}.");

                return null;
            }

            $items = $resultsResponse->json();

            return $this->extractBestPdfUrl($ticker, $items);

        } catch (\Exception $e) {
            Log::error("NgxPulseFallbackService: Exception for {$ticker}: ".$e->getMessage());

            return null;
        }
    }

    /**
     * From the raw Apify result items, pick the best-matching PDF link
     * for the given ticker.
     *
     * Scoring priority:
     *   3 pts – URL contains the ticker symbol
     *   2 pts – title contains a financial keyword
     *   1 pt  – URL is a direct PDF (.pdf extension)
     *
     * Returns the URL with the highest score, or null.
     *
     * @param  string  $ticker
     * @param  array   $items   Apify dataset items
     * @return string|null
     */
    private function extractBestPdfUrl(string $ticker, array $items): ?string
    {
        $tickerLower   = strtolower($ticker);
        $bestUrl       = null;
        $bestScore     = -1;

        foreach ($items as $item) {
            $links = $item['links'] ?? [];

            foreach ($links as $link) {
                $text = strtolower($link['text'] ?? '');
                $url  = $link['url']  ?? '';

                if (empty($url)) {
                    continue;
                }

                // Must be a real document link (PDF or NGX doclib)
                $isPdf      = stripos($url, '.pdf') !== false;
                $isDoclib   = stripos($url, 'doclib.ngxgroup.com') !== false;

                if (! $isPdf && ! $isDoclib) {
                    continue;
                }

                // Check for financial keyword in title
                $hasFinancialKeyword = false;
                foreach (self::FINANCIAL_KEYWORDS as $keyword) {
                    if (str_contains($text, $keyword)) {
                        $hasFinancialKeyword = true;
                        break;
                    }
                }

                if (! $hasFinancialKeyword) {
                    continue;
                }

                // Score the link
                $score = 0;
                $score += $hasFinancialKeyword ? 2 : 0;
                $score += $isPdf                ? 1 : 0;
                $score += stripos($url, $tickerLower) !== false || stripos($text, $tickerLower) !== false ? 3 : 0;

                if ($score > $bestScore) {
                    $bestScore = $score;
                    $bestUrl   = $url;
                }
            }
        }

        if ($bestUrl) {
            Log::info("NgxPulseFallbackService: Found PDF for {$ticker} via ngxpulse.ng fallback: {$bestUrl}");
        } else {
            Log::warning("NgxPulseFallbackService: No financial PDF found for {$ticker} on ngxpulse.ng/disclosures.");
        }

        return $bestUrl;
    }
}
