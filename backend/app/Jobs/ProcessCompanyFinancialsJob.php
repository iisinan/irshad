<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Company;
use App\Models\Financial;
use App\Services\NgxDocumentScraperService;
use App\Services\AiDocumentParserService;
use App\Services\AaoifiComplianceService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProcessCompanyFinancialsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $company;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var array
     */
    public $backoff = [30, 60, 120]; // Wait 30s on 1st fail, 60s on 2nd, 120s on 3rd

    /**
     * Create a new job instance.
     */
    public function __construct(Company $company)
    {
        $this->company = $company;
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

        // 1. Find PDF
        $pdfUrl = $scraper->findLatestFinancialReportPdfUrl($symbol);
        if (!$pdfUrl) {
            Log::warning("No PDF found for {$symbol}");
            return;
        }

        Log::info("Found PDF for {$symbol}: {$pdfUrl}");

        // 2. Download the PDF locally
        $tempPath = storage_path('app/temp_financials_' . $symbol . '_' . time() . '.pdf');
        try {
            $response = Http::timeout(300)->withOptions([
                'sink' => $tempPath
            ])->get($pdfUrl);

            if (!$response->successful()) {
                Log::warning("Failed to download PDF for {$symbol}");
                if (file_exists($tempPath)) {
                    unlink($tempPath);
                }
                return;
            }
        } catch (\Exception $e) {
            Log::warning("Error downloading PDF for {$symbol}: " . $e->getMessage());
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }
            return;
        }

        // 3. Extract Financials
        Log::info("Sending {$symbol} Document to Gemini for extraction...");
        $extractedData = $parser->extractFinancialsFromPdf($tempPath);

        // Clean up the temporary file
        if (file_exists($tempPath)) {
            unlink($tempPath);
        }

        if (!$extractedData) {
            Log::error("AI Extraction failed for {$symbol}");
            // Throw exception so Laravel Queue records this as a failure and retries
            throw new \Exception("AI Extraction failed for {$symbol} (Gemini API returned null).");
        }

        // 4. Save to Database
        $financial = Financial::updateOrCreate(
            ['company_id' => $this->company->id],
            [
                'total_assets' => $this->cleanNumber($extractedData['total_assets'] ?? null),
                'total_debt' => $this->cleanNumber($extractedData['total_debt'] ?? null),
                'total_revenue' => $this->cleanNumber($extractedData['total_revenue'] ?? null),
                'interest_income' => $this->cleanNumber($extractedData['interest_income'] ?? null),
                'eps' => $this->cleanNumber($extractedData['eps'] ?? null),
                'pe_ratio' => $this->cleanNumber($extractedData['pe_ratio'] ?? null),
                'roe' => $this->cleanNumber($extractedData['roe'] ?? null),
                'dividend_yield' => $this->cleanNumber($extractedData['dividend_yield'] ?? null),
                'profit_margin' => $this->cleanNumber($extractedData['profit_margin'] ?? null),
                'cash_and_equivalents' => $this->cleanNumber($extractedData['cash_and_equivalents'] ?? null),
                'interest_bearing_securities' => $this->cleanNumber($extractedData['interest_bearing_securities'] ?? null),
                'accounts_receivable' => $this->cleanNumber($extractedData['accounts_receivable'] ?? null),
                'illiquid_assets' => $this->cleanNumber($extractedData['illiquid_assets'] ?? null),
            ]
        );

        Log::info("Saved financials for {$symbol}. Triggering AAOIFI Evaluation...");

        // 5. Trigger AAOIFI Evaluation
        $complianceService->evaluateCompliance($this->company, $financial);

        Log::info("Completed {$symbol} successfully via Queue.");
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
