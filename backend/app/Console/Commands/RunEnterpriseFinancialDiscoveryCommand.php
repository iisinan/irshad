<?php

namespace App\Console\Commands;

use App\Jobs\ProcessCompanyFinancialsJob;
use App\Models\Company;
use App\Models\Financial;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RunEnterpriseFinancialDiscoveryCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'financials:enterprise-discovery';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Phase 1-9: Retrieve NGXPulse API, filter latest valid financial reports, and dispatch jobs.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting Enterprise Discovery Phase...");

        // Phase 1-2: Retrieve NGXPulse API Feed
        $apiUrl = 'https://ngxpulse.ng/api/ngxdata/disclosures?limit=1000';
        $this->info("Fetching: {$apiUrl}");

        try {
            $apiKey = env('NGXPULSE_API_KEY', config('services.ngxpulse.key', ''));
            $response = Http::withHeaders([
                'accept' => 'application/json',
                'X-API-Key' => $apiKey,
                'Referer' => 'https://ngxpulse.ng/',
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            ])->timeout(30)->get($apiUrl);
            
            // Phase 3: Validate Feed Integrity
            if (!$response->successful()) {
                $this->error("Failed to fetch NGXPulse API. Status: " . $response->status());
                Log::error("NGXPulse API Discovery failed. Status: " . $response->status());
                return;
            }

            $data = $response->json();
            if (isset($data['data']) && is_array($data['data'])) {
                $data = $data['data'];
            }
            
            if (!is_array($data) || empty($data)) {
                $this->error("API feed is empty.");
                return;
            }

        } catch (\Exception $e) {
            $this->error("Connection error: " . $e->getMessage());
            Log::error("NGXPulse API Discovery exception: " . $e->getMessage());
            return;
        }

        $this->info("Successfully fetched " . count($data) . " disclosures from NGXPulse.");

        // Phase 4-6: Identify Financial Statements & Select Latest Filing
        $latestFilingsByTicker = [];
        
        $validFinancialKeywords = [
            'annual report',
            'audited financial',
            'unaudited financial',
            'q1', 'q2', 'q3',
            'half year', 'half-year',
            'nine month', 'nine-month'
        ];

        $ignoredKeywords = [
            'dividend', 'agm', 'rights issue', 'press release', 'board meeting', 'corporate action', 'insider'
        ];

        foreach ($data as $disclosure) {
            $ticker = $disclosure['symbol'] ?? $disclosure['ticker'] ?? null;
            $title = strtolower($disclosure['title'] ?? $disclosure['disclosure_title'] ?? '');
            $pdfUrl = $disclosure['url'] ?? $disclosure['pdf_url'] ?? null;
            $type = $disclosure['type'] ?? '';

            if (!$ticker || !$title || !$pdfUrl) {
                continue; // Malformed record
            }

            $ticker = trim(strtoupper($ticker));

            // If we already found the newest one for this ticker, skip older ones
            if (isset($latestFilingsByTicker[$ticker])) {
                continue;
            }

            // Optional: Strictly rely on the API's "type" if it's reliable
            if (stripos($type, 'Financial Statement') === false) {
                // If it's not explicitly a financial statement, we still check the keywords
                // just in case NGX miscategorized it.
                $isIgnored = false;
                foreach ($ignoredKeywords as $keyword) {
                    if (strpos($title, $keyword) !== false) {
                        $isIgnored = true;
                        break;
                    }
                }

                if ($isIgnored) {
                    continue;
                }

                $isValidFinancial = false;
                foreach ($validFinancialKeywords as $keyword) {
                    if (strpos($title, $keyword) !== false) {
                        $isValidFinancial = true;
                        break;
                    }
                }

                if (!$isValidFinancial) {
                    continue;
                }
            }

            // Phase 5: Select the Latest Filing (Since feed is newest->oldest)
            $latestFilingsByTicker[$ticker] = [
                'title' => $disclosure['title'] ?? $disclosure['disclosure_title'] ?? '',
                'pdf_url' => $pdfUrl,
                'published_date' => $disclosure['created'] ?? $disclosure['publication_date'] ?? null,
            ];
        }

        $this->info("Identified latest financial reports for " . count($latestFilingsByTicker) . " companies.");
        $this->info("Keys: " . implode(", ", array_keys($latestFilingsByTicker)));

        $companies = Company::whereHas('aaoifiScreening', function ($query) {
            $query->where('business_status', 'pass');
        })->get();

        $dispatchedCount = 0;
        $fallbackCount = 0;

        foreach ($companies as $company) {
            $ticker = trim(strtoupper($company->symbol));

            if (isset($latestFilingsByTicker[$ticker])) {
                $candidate = $latestFilingsByTicker[$ticker];
                $pdfUrl = $candidate['pdf_url'];

                // Phase 8 (Layer 1): Database URL check to skip Queue entirely if already processed
                if (Financial::where('source_url', $pdfUrl)->exists()) {
                    $this->info("[{$ticker}] PDF URL already in database. Skipping dispatch.");
                    continue;
                }

                $this->info("[{$ticker}] Dispatched via API feed. URL: {$pdfUrl}");
                ProcessCompanyFinancialsJob::dispatch($company, $pdfUrl);
                $dispatchedCount++;
            } else {
                $this->info("[{$ticker}] Not found in API feed. Skipping as per new rule.");
                // Removed Apify fallback
            }
        }

        $this->info("Discovery Complete. Dispatched {$dispatchedCount} API jobs and {$fallbackCount} Fallback jobs.");
    }
}
