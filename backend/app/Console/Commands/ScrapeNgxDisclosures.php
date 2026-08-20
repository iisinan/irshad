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
    protected $description = 'Scrape NGXPulse for new financial disclosures and notify if new';

    public function handle()
    {
        $this->info("Fetching data from NGX Pulse Disclosures...");

        $response = Http::withHeaders([
            'Referer' => 'https://ngxpulse.ng/',
        ])->get('https://ngxpulse.ng/api/ngxdata/disclosures?limit=50');

        if (! $response->successful()) {
            $this->error('Failed to fetch from NGX Pulse API: ' . $response->status());
            return 1;
        }

        $data = $response->json();
        $disclosures = $data['data'] ?? [];

        if (empty($disclosures)) {
            $this->info("No disclosures found.");
            return 0;
        }

        $this->info('Found ' . count($disclosures) . ' disclosures. Processing...');

        foreach ($disclosures as $disclosure) {
            $type = strtolower($disclosure['type'] ?? '');
            $title = strtolower($disclosure['title'] ?? '');

            // Check if it's a financial statement (strictly avoiding 'meeting results' or unrelated docs)
            $isFinancial = (str_contains($type, 'financial') || str_contains($title, 'financial') || str_contains($title, 'audited') || str_contains($title, 'unaudited')) || 
                           (str_contains($title, 'results') && !str_contains($title, 'meeting') && !str_contains($title, 'agm'));

            if ($isFinancial) {
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
        $existingDisclosure = CorporateDisclosure::where('company_symbol', $symbol)
            ->where('published_at', $publishedAt)
            ->first();

        if ($existingDisclosure) {
            $this->line("Skipping {$symbol} - already in CorporateDisclosure by published_at.");
            return;
        }

        // It's not in corporate disclosures. Now check the SHA in financials table
        $isNewByHash = true;
        if ($pdfUrl) {
            $tempPath = storage_path('app/temp_disclosure_' . $symbol . '_' . time() . '.pdf');
            $downloaded = $this->downloadFile($pdfUrl, $tempPath);

            if ($downloaded && file_exists($tempPath) && filesize($tempPath) > 0) {
                $fileHash = hash_file('sha256', $tempPath);
                
                // Check if hash exists in financials
                if (Financial::where('file_hash', $fileHash)->exists()) {
                    $isNewByHash = false;
                    $this->line("Skipping {$symbol} - SHA hash already exists in Financials.");
                }

                unlink($tempPath); // cleanup
            } else {
                $this->warn("Failed to download PDF for {$symbol}. Proceeding as new.");
            }
        }

        // If it's a completely new financial statement
        if ($isNewByHash) {
            $this->info("New financial statement found for {$symbol}!");
            
            // Save to corporate disclosures
            CorporateDisclosure::create([
                'company_symbol' => $symbol,
                'company_name' => $company->name,
                'title' => $title,
                'pdf_url' => $pdfUrl,
                'submission_type' => 'Financial Statement',
                'published_at' => $publishedAt,
            ]);

            // Notify user
            try {
                Mail::to('sinanismailaidris@gmail.com')->send(new NewFinancialStatementAlert($company, $title, $pdfUrl));
                $this->info("Alert email sent for {$symbol}.");
            } catch (\Exception $e) {
                Log::error("Failed to send financial alert for {$symbol}: " . $e->getMessage());
                $this->error("Failed to send alert email for {$symbol}.");
            }
        }
    }

    private function downloadFile(string $url, string $path): bool
    {
        try {
            $fp = fopen($path, 'w+');
            if (!$fp) return false;

            $ch = curl_init(str_replace(' ', '%20', $url));
            curl_setopt($ch, CURLOPT_TIMEOUT, 60);
            curl_setopt($ch, CURLOPT_FILE, $fp);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_FAILONERROR, true);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
            $success = curl_exec($ch);
            curl_close($ch);
            fclose($fp);

            return $success !== false;
        } catch (\Exception $e) {
            return false;
        }
    }
}
