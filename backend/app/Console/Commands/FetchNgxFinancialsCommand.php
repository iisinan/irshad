<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use App\Models\Financial;
use App\Services\NgxDocumentScraperService;
use App\Services\AiDocumentParserService;
use App\Services\AaoifiComplianceService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class FetchNgxFinancialsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'financials:fetch {--ticker= : Fetch for a specific ticker} {--skip-existing : Skip companies that already have financials}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scrape and extract latest financial PDF reports via AI to update compliance ratios';

    private $scraper;
    private $parser;
    private $complianceService;

    public function __construct(
        NgxDocumentScraperService $scraper, 
        AiDocumentParserService $parser,
        AaoifiComplianceService $complianceService
    ) {
        parent::__construct();
        $this->scraper = $scraper;
        $this->parser = $parser;
        $this->complianceService = $complianceService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        ini_set('memory_limit', '1G');
        ini_set('max_execution_time', 0);
        
        $tickerOpt = $this->option('ticker');
        $skipExisting = $this->option('skip-existing');
        
        $query = Company::query();
        if ($tickerOpt) {
            $query->where('symbol', strtoupper($tickerOpt));
        }
        
        if ($skipExisting) {
            $query->where(function ($q) {
                $q->doesntHave('financials')
                  ->orWhereHas('financials', function ($q2) {
                      $q2->whereNull('cash_and_equivalents');
                  });
            });
        }

        $companies = $query->get();
        $this->info("Starting financial extraction for " . $companies->count() . " companies.");

        foreach ($companies as $company) {
            $this->info("Processing {$company->symbol}...");
            
            // 1. Find PDF
            $pdfUrl = $this->scraper->findLatestFinancialReportPdfUrl($company->symbol);
            if (!$pdfUrl) {
                $this->warn("No PDF found for {$company->symbol}");
                continue;
            }

            $this->info("Found PDF: {$pdfUrl}");

            // 2. Download the PDF locally
            $tempPath = storage_path('app/temp_financials_' . $company->symbol . '.pdf');
            try {
                $response = Http::timeout(60)->get($pdfUrl);
                if ($response->successful()) {
                    file_put_contents($tempPath, $response->body());
                } else {
                    $this->warn("Failed to download PDF for {$company->symbol}");
                    continue;
                }
            } catch (\Exception $e) {
                $this->warn("Error downloading PDF for {$company->symbol}: " . $e->getMessage());
                continue;
            }

            // 3. Extract Financials
            $this->info("Sending Document to Gemini for extraction...");
            $extractedData = $this->parser->extractFinancialsFromPdf($tempPath);

            // Clean up the temporary file
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }

            if (!$extractedData) {
                $this->error("AI Extraction failed for {$company->symbol}");
                continue;
            }

            // 4. Save to Database
            $financial = Financial::updateOrCreate(
                ['company_id' => $company->id],
                [
                    'total_assets' => $this->cleanNumber($extractedData['total_assets']),
                    'total_debt' => $this->cleanNumber($extractedData['total_debt']),
                    'total_revenue' => $this->cleanNumber($extractedData['total_revenue']),
                    'interest_income' => $this->cleanNumber($extractedData['interest_income']),
                    'eps' => $this->cleanNumber($extractedData['eps']),
                    'pe_ratio' => $this->cleanNumber($extractedData['pe_ratio']),
                    'roe' => $this->cleanNumber($extractedData['roe']),
                    'dividend_yield' => $this->cleanNumber($extractedData['dividend_yield']),
                    'profit_margin' => $this->cleanNumber($extractedData['profit_margin']),
                    'cash_and_equivalents' => $this->cleanNumber($extractedData['cash_and_equivalents']),
                    'interest_bearing_securities' => $this->cleanNumber($extractedData['interest_bearing_securities']),
                    'accounts_receivable' => $this->cleanNumber($extractedData['accounts_receivable']),
                    'illiquid_assets' => $this->cleanNumber($extractedData['illiquid_assets']),
                ]
            );

            $this->info("Saved financials for {$company->symbol}. Triggering AAOIFI Evaluation...");

            // 5. Trigger AAOIFI Evaluation
            // The service checks compliance based on the updated financial metrics.
            // (Assumes AaoifiComplianceService uses the Financial model)
            $this->complianceService->evaluateCompliance($company, $financial);

            $this->info("Completed {$company->symbol} successfully.");
            
            // Add a delay to avoid hitting rate limits (Tokens Per Minute)
            $this->info('Sleeping for 20 seconds to respect Gemini API TPM limits...');
            sleep(20);
        }

        $this->info("All done!");
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
