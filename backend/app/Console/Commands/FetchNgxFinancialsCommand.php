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
        $this->info("Found " . $companies->count() . " companies to process.");

        foreach ($companies as $index => $company) {
            // Delay each job by 22 seconds to respect Gemini API limits
            $delaySeconds = $index * 22;
            \App\Jobs\ProcessCompanyFinancialsJob::dispatch($company)->delay(now()->addSeconds($delaySeconds));
            
            $this->info("Dispatched Job for {$company->symbol} (Delay: {$delaySeconds}s)");
        }

        $this->info("All jobs successfully dispatched to the Redis Queue!");
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
