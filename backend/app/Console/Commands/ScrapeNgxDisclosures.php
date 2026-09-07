<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Models\Company;
use App\Models\CorporateDisclosure;
use App\Models\Financial;
use App\Mail\NewFinancialStatementAlert;
use Carbon\Carbon;

class ScrapeNgxDisclosures extends Command
{
    protected $signature = 'irshad:scrape-disclosures';
    protected $description = 'Scrape NGX Official Doclib for new financial disclosures and notify if new';

    public function handle()
    {
        $this->info("Fetching data from NGX Official Document Library...");

        // Official NGX SharePoint REST API endpoint (no API key required)
        $url = "https://doclib.ngxgroup.com/_api/Web/Lists/GetByTitle('XFinancial_News')/items/?\$select=URL,Modified,Created,CompanyName,CompanySymbol,InternationSecIN,Type_of_Submission&\$orderby=Created%20desc&\$Top=50";

        $response = Http::withHeaders([
            'Accept' => 'application/json;odata=verbose',
        ])->get($url);

        if (! $response->successful()) {
            $this->error('Failed to fetch from NGX Official API: ' . $response->status());
            return 1;
        }

        $data = $response->json();
        $disclosures = $data['d']['results'] ?? [];

        if (empty($disclosures)) {
            $this->info("No disclosures found.");
            return 0;
        }

        $this->info('Found ' . count($disclosures) . ' disclosures. Processing...');

        foreach ($disclosures as $doc) {
            $type = strtolower($doc['Type_of_Submission'] ?? '');
            $title = strtolower($doc['URL']['Description'] ?? '');
            $pdfUrl = $doc['URL']['Url'] ?? null;
            $symbol = $doc['CompanySymbol'] ?? null;
            $createdAt = $doc['Created'] ?? null;

            // Check if it's a financial statement (strictly avoiding 'meeting results' or unrelated docs)
            $isFinancial = (str_contains($type, 'financial') || str_contains($title, 'financial') || str_contains($title, 'audited') || str_contains($title, 'unaudited')) || 
                           (str_contains($title, 'results') && !str_contains($title, 'meeting') && !str_contains($title, 'agm'));

            // Explicitly ignore unrelated document types that might slip through
            if (str_contains($title, 'director') || 
                str_contains($title, 'board meeting') || 
                str_contains($title, 'corporate action') || 
                str_contains($type, 'corporate action') ||
                str_contains($title, 'change') ||
                str_contains($title, 'coorporate action')) {
                $isFinancial = false;
            }

            if ($isFinancial && $symbol && $pdfUrl && $createdAt) {
                // Normalize array to match the old format expected by processFinancialDisclosure
                $disclosure = [
                    'symbol' => $symbol,
                    'created' => $createdAt,
                    'url' => $pdfUrl,
                    'title' => $doc['URL']['Description'] ?? 'Financial Statement'
                ];
                $this->processFinancialDisclosure($disclosure);
            }
        }

        $this->info('Scraping complete.');
        return 0;
    }

    private function processFinancialDisclosure(array $disclosure)
    {
        $symbol = $disclosure['symbol'] ?? null;
        if (!$symbol) return;

        $company = Company::where('symbol', $symbol)->first();
        if (!$company) return;

        $publishedAt = Carbon::parse($disclosure['created'] ?? now());
        $pdfUrl = $disclosure['url'] ?? null;
        $title = $disclosure['title'] ?? 'Financial Statement';

        // Check if we already have it in corporate_disclosures by publication date
        // Check if we already have it in corporate_disclosures by pdf URL or Title
        $existingDisclosure = CorporateDisclosure::where('company_symbol', $symbol)
            ->where(function($q) use ($pdfUrl, $title) {
                $q->where('pdf_url', $pdfUrl)
                  ->orWhere('title', $title);
            })
            ->first();

        if ($existingDisclosure) {
            $this->line("Skipping {$symbol} - already in CorporateDisclosure by published_at.");
            return;
        }

        // Also ensure we don't repeatedly send email if it somehow failed in corporate_disclosures but exists in financials
        // Wait, normally we trust corporate_disclosures as the truth of processed files.

        $this->info("NEW DISCLOSURE FOUND: {$symbol} - {$title}");
        $this->info("Downloading PDF to compute SHA-256 hash before notifying...");

        try {
            $pdfResponse = Http::timeout(60)->get($pdfUrl);
            if ($pdfResponse->successful()) {
                $fileContent = $pdfResponse->body();
                $fileHash = hash('sha256', $fileContent);
                
                // Check if this hash already exists in financials for this company
                $existingFinancial = Financial::where('company_id', $company->id)
                    ->where('file_hash', $fileHash)
                    ->first();

                if ($existingFinancial) {
                    $this->warn("Duplicate file detected! The SHA-256 hash matches an already processed financial statement. Skipping email.");
                    
                    // Save to CorporateDisclosure so we don't download it again next time
                    CorporateDisclosure::create([
                        'company_symbol' => $symbol,
                        'title' => $title,
                        'pdf_url' => $pdfUrl,
                        'published_at' => $publishedAt
                    ]);
                    return;
                }
            } else {
                $this->warn("Failed to download PDF for hashing. Proceeding anyway.");
            }
        } catch (\Exception $e) {
            $this->warn("Error during PDF download/hashing: " . $e->getMessage() . ". Proceeding anyway.");
        }

        // Save to DB
        $cd = CorporateDisclosure::create([
            'company_symbol' => $symbol,
            'title' => $title,
            'pdf_url' => $pdfUrl,
            'published_at' => $publishedAt
        ]);

        // Send Email
        Mail::to(['mairopettel@gmail.com', 'iirshad2026@gmail.com'])->send(new NewFinancialStatementAlert($company, $pdfUrl, $title));
        $this->info("Alert email sent to mairopettel@gmail.com and iirshad2026@gmail.com for {$symbol}.");

    }
}
