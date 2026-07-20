<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NgxDocumentScraperService
{
    /**
     * Find the URL to the latest quarterly or annual financial statement PDF for a given ticker.
     * Uses the official NGX SharePoint REST API.
     * 
     * @param string $ticker The stock ticker symbol (e.g., MTNN)
     * @return string|null The direct URL to the PDF, or null if not found
     */
    public function findLatestFinancialReportPdfUrl(string $ticker): ?string
    {
        Log::info("Fetching latest financial PDF for {$ticker} from NGX Data Portal");

        $url = "https://doclib.ngxgroup.com/_api/Web/Lists/GetByTitle('XFinancial_News')/items";
        
        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json;odata=verbose',
            ])->retry(3, 5000, function ($exception, $request) {
                Log::warning("Retrying NGX API request for {$ticker} due to: " . $exception->getMessage());
                return $exception instanceof \Illuminate\Http\Client\ConnectionException || $exception->getCode() >= 500;
            })->timeout(15)->get($url, [
                '$select' => 'URL,Modified,Created,CompanyName,CompanySymbol,InternationSecIN,Type_of_Submission',
                '$orderby' => 'Created desc',
                '$filter' => "CompanySymbol eq '{$ticker}' and Type_of_Submission eq 'Financial Statements'",
                '$Top' => 1
            ]);

            if (!$response->successful()) {
                Log::error("NGX API Request Failed for {$ticker}. Status: " . $response->status());
                return null;
            }

            $data = $response->json();
            $results = $data['d']['results'] ?? [];

            if (count($results) > 0) {
                $pdfUrl = $results[0]['URL']['Url'] ?? null;
                
                if ($pdfUrl) {
                    Log::info("Found PDF via NGX API: {$pdfUrl}");
                    return $pdfUrl;
                }
            }

        } catch (\Exception $e) {
            Log::error("Exception while fetching from NGX API for {$ticker}: " . $e->getMessage());
        }

        Log::warning("Could not find a valid PDF financial report for {$ticker}");
        return null;
    }
}
