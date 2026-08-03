<?php

namespace App\Jobs;

use App\Models\Company;
use App\Services\AaoifiComplianceService;
use App\Services\AiDocumentParserService;
use App\Services\FinancialUpdateService;
use App\Services\NgxDocumentScraperService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\Middleware\RateLimited;

class ProcessCompanyFinancialsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function middleware()
    {
        return [new RateLimited('gemini-api')];
    }

    public $company;
    
    public ?string $pdfUrl;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300;

    /**
     * The number of times the job may be attempted (high to allow rate-limit releases).
     *
     * @var int
     */
    public $tries = 500;

    /**
     * The maximum number of unhandled exceptions to allow before failing.
     *
     * @var int
     */
    public $maxExceptions = 3;

    /**
     * The number of seconds to wait before retrying the job on exception.
     *
     * @var array
     */
    public $backoff = [30, 60, 120]; // Wait 30s on 1st fail, 60s on 2nd, 120s on 3rd

    /**
     * Create a new job instance.
     */
    public function __construct(Company $company, ?string $pdfUrl = null)
    {
        $this->company = $company;
        $this->pdfUrl = $pdfUrl;
    }

    /**
     * Execute the job.
     */
    public function handle(
        NgxDocumentScraperService $scraper,
        AiDocumentParserService $parser,
        AaoifiComplianceService $complianceService
    ) {
        $symbol = $this->company->symbol;
        Log::info("Job started for {$symbol}...");

        // Acquire a Redis Lock to prevent duplicate concurrent processing (Race Conditions)
        $lock = \Illuminate\Support\Facades\Cache::lock("financial_discovery_{$symbol}", 300);

        if (! $lock->get()) {
            Log::warning("[{$symbol}] Job is already running. Skipping to prevent race condition.");
            return;
        }

        try {
            // 1. Resolve PDF URL
            $pdfUrl = $this->pdfUrl;
            
            if (!$pdfUrl) {
                // Phase 9: Fallback to Apify
                Log::info("[{$symbol}] No URL provided from API Phase. Triggering Apify fallback...");
                $pdfUrl = $scraper->findLatestFinancialReportPdfUrl($symbol);
            }

            if (! $pdfUrl) {
                Log::warning("[{$symbol}] No financial statement PDF found via any source. Skipping.");
                return;
            }

            // Layer 1 Duplicate Check: Have we processed this URL before?
            if (\App\Models\Financial::where('source_url', $pdfUrl)->exists()) {
                Log::info("[{$symbol}] PDF URL already processed. Skipping.");
                return;
            }

            Log::info("Found NEW PDF URL for {$symbol}: {$pdfUrl}");

            // 2. Download the PDF locally
            $tempPath = storage_path('app/temp_financials_'.$symbol.'_'.time().'.pdf');
            $this->downloadFile($pdfUrl, $tempPath);

            if (! file_exists($tempPath) || filesize($tempPath) === 0) {
                Log::warning("Failed to download or empty PDF for {$symbol}.");
                return;
            }

            // Layer 2 Duplicate Check: SHA-256 Hash
            $fileHash = hash_file('sha256', $tempPath);
            if (\App\Models\Financial::where('file_hash', $fileHash)->exists()) {
                Log::info("[{$symbol}] PDF Hash ({$fileHash}) already processed. Skipping exact duplicate.");
                unlink($tempPath);
                return;
            }

            // 3. PDF Pre-validation (Smalot) - Optional Dependency
            if (class_exists(\Smalot\PdfParser\Parser::class)) {
                if (! $this->validatePdf($tempPath, $symbol, $this->company->name)) {
                    Log::error("[{$symbol}] PDF Pre-validation failed. Does not look like a valid financial statement for this company.");
                    unlink($tempPath);
                    return;
                }
            } else {
                Log::info("[{$symbol}] smalot/pdfparser not installed, skipping PDF pre-validation.");
            }

            // 4. Archive to Cloudflare S3 - Optional Dependency
            $s3Url = null;
            if (class_exists(\Aws\S3\S3Client::class)) {
                $s3Path = 'financial-statements/' . date('Y') . "/{$symbol}_{$fileHash}.pdf";
                \Illuminate\Support\Facades\Storage::disk('s3')->put($s3Path, file_get_contents($tempPath));
                $s3Url = \Illuminate\Support\Facades\Storage::disk('s3')->url($s3Path);
                Log::info("[{$symbol}] Archived PDF to S3: {$s3Url}");
            } else {
                Log::info("[{$symbol}] league/flysystem-aws-s3-v3 not installed, skipping S3 upload.");
            }

            // 5. Extract Financials
            Log::info("Sending {$symbol} Document to Gemini for extraction...");
            $extractedData = $parser->extractFinancialsFromPdf($tempPath);

            if (file_exists($tempPath)) {
                unlink($tempPath);
            }

            if (! $extractedData) {
                throw new \Exception("AI Extraction failed for {$symbol} (Gemini API returned null).");
            }
            
            // Post-Extraction Validation
            $totalAssets = $this->cleanNumber($extractedData['total_assets'] ?? null);
            if (! $totalAssets || $totalAssets <= 0) {
                throw new \Exception("AI Validation failed for {$symbol}: Total Assets is zero or null.");
            }

            $newData = [
                'total_assets'                  => $totalAssets,
                'total_debt'                    => $this->cleanNumber($extractedData['total_debt'] ?? null),
                'total_revenue'                 => $this->cleanNumber($extractedData['total_revenue'] ?? null),
                'interest_income'               => $this->cleanNumber($extractedData['interest_income'] ?? null),
                'eps'                           => $this->cleanNumber($extractedData['eps'] ?? null),
                'pe_ratio'                      => $this->cleanNumber($extractedData['pe_ratio'] ?? null),
                'roe'                           => $this->cleanNumber($extractedData['roe'] ?? null),
                'dividend_yield'                => $this->cleanNumber($extractedData['dividend_yield'] ?? null),
                'profit_margin'                 => $this->cleanNumber($extractedData['profit_margin'] ?? null),
                'cash_and_equivalents'          => $this->cleanNumber($extractedData['cash_and_equivalents'] ?? null),
                'interest_bearing_securities'   => $this->cleanNumber($extractedData['interest_bearing_securities'] ?? null),
                'accounts_receivable'           => $this->cleanNumber($extractedData['accounts_receivable'] ?? null),
                'illiquid_assets'               => $this->cleanNumber($extractedData['illiquid_assets'] ?? null),
                'net_income'                    => $this->cleanNumber($extractedData['net_income'] ?? null),
                'reporting_period'              => $extractedData['reporting_period'] ?? null,
                'interest_income_ratio'         => $this->cleanNumber($extractedData['interest_income_ratio'] ?? null),
                'non_compliant_income_ratio'    => $this->cleanNumber($extractedData['non_compliant_income_ratio'] ?? null),
                
                // Enterprise Metadata
                'source_url'                    => $pdfUrl,
                'file_hash'                     => $fileHash,
                's3_url'                        => $s3Url,
                'extraction_schema_version'     => 'v1.0',
            ];

            // 6. Save to Database (Atomic Transaction)
            \Illuminate\Support\Facades\DB::transaction(function () use ($newData) {
                $financialUpdateService = app(FinancialUpdateService::class);
                $financialUpdateService->proposeUpdate(
                    $this->company,
                    $newData,
                    'AI extraction from verified financial report (v1.0)'
                );
            });

            Log::info("Completed {$symbol} successfully via Queue.");
        } finally {
            $lock->release();
        }
    }

    private function downloadFile(string $url, string $path): void
    {
        $fp = fopen($path, 'w+');
        $ch = curl_init(str_replace(' ', '%20', $url));
        curl_setopt($ch, CURLOPT_TIMEOUT, 300);
        curl_setopt($ch, CURLOPT_FILE, $fp);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_FAILONERROR, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        curl_exec($ch);
        fclose($fp);
    }

    private function validatePdf(string $path, string $symbol, ?string $companyName): bool
    {
        if (!class_exists(\Smalot\PdfParser\Parser::class)) {
            return true;
        }
        
        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf = $parser->parseFile($path);
            $pages = $pdf->getPages();

            if (count($pages) === 0) {
                return false;
            }

            // Extract text from the first 3 pages
            $text = '';
            for ($i = 0; $i < min(3, count($pages)); $i++) {
                $text .= $pages[$i]->getText() . ' ';
            }

            $textLower = strtolower($text);
            $symbolLower = strtolower($symbol);
            $nameLower = strtolower($companyName ?? '');

            // Try to match symbol
            if (str_contains($textLower, $symbolLower)) {
                return true;
            }

            // Fuzzy match the first word of the company name (e.g. "Airtel" for Airtel Africa Plc)
            if ($nameLower) {
                $parts = explode(' ', $nameLower);
                if (count($parts) > 0 && strlen($parts[0]) > 3) {
                    if (str_contains($textLower, $parts[0])) {
                        return true;
                    }
                }
            }

            // If neither symbol nor name found, reject
            return false;

        } catch (\Exception $e) {
            Log::warning("PDF Parser Exception for {$symbol}: " . $e->getMessage());
            return false;
        }
    }

    private function cleanNumber($value)
    {
        if ($value === null || $value === '' || stripos($value, 'n/a') !== false || stripos($value, 'not disclosed') !== false) {
            return null;
        }
        if (is_numeric($value)) {
            return (float) $value;
        }

        // Remove everything except numbers, dots, and minus signs
        $cleaned = preg_replace('/[^0-9.-]/', '', $value);

        if ($cleaned === '' || $cleaned === '-' || $cleaned === '.') {
            return null;
        }

        return (float) $cleaned;
    }
}
