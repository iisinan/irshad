<?php

namespace App\Jobs;

use App\Models\Company;
use App\Models\CorporateDisclosure;
use App\Services\AaoifiComplianceService;
use App\Services\FinancialUpdateService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class ExtractFinancialPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 180; // 3 minutes per PDF max

    public $item;

    public function __construct(array $item)
    {
        $this->item = $item;
    }

    public function handle(AaoifiComplianceService $complianceService): void
    {
        $item = $this->item;
        $symbol = $item['CompanySymbol'] ?? 'UNKNOWN';
        $pdfUrl = $item['URL']['Url'] ?? null;
        $title = $item['URL']['Description'] ?? 'No Title';
        $companyName = $item['CompanyName'] ?? null;
        $submissionType = $item['Type_of_Submission'] ?? null;
        $publishedAt = isset($item['Created']) ? Carbon::parse($item['Created']) : now();

        Log::info("Processing PDF Extraction for {$symbol}");

        $disclosure = CorporateDisclosure::firstOrCreate(
            [
                'company_symbol' => $symbol,
                'title' => $title,
            ],
            [
                'company_name' => $companyName,
                'pdf_url' => $pdfUrl,
                'submission_type' => $submissionType,
                'published_at' => $publishedAt,
            ]
        );

        if (! $disclosure->wasRecentlyCreated) {
            Log::info("Disclosure already exists for {$symbol}. Skipping extraction.");

            return;
        }

        if (! $pdfUrl || ! str_contains(strtolower($pdfUrl), '.pdf')) {
            Log::info("No valid PDF URL for {$symbol}. Skipping extraction.");

            return;
        }

        $company = Company::firstOrCreate(
            ['symbol' => $symbol],
            ['name' => $companyName ?? $symbol, 'sector' => 'Unknown', 'business_type' => 'Equities']
        );

        $scriptPath = base_path('scripts/extract_pdf_financials.py');
        $pythonPath = base_path('venv/bin/python3');

        $process = new Process([$pythonPath, $scriptPath, $pdfUrl]);
        $process->setTimeout(120);
        $process->run();

        if ($process->isSuccessful()) {
            $result = json_decode($process->getOutput(), true);
            if ($result && isset($result['status']) && $result['status'] === 'success') {
                $newData = [
                    'reporting_period' => now()->year.'-Q'.ceil(now()->month / 3),
                    'total_assets' => $result['total_assets'] ?? 0,
                    'total_debt' => $result['total_debt'] ?? 0,
                    'total_revenue' => $result['total_revenue'] ?? 1,
                    'interest_income' => $result['interest_income'] ?? 0,
                    'non_halal_income' => $result['interest_income'] ?? 0,
                ];

                $financialUpdateService = app(FinancialUpdateService::class);
                $financialUpdateService->proposeUpdate(
                    $company,
                    $newData,
                    'AI extraction from recent PDF upload'
                );

                Log::info("Successfully extracted financials for {$symbol}. Queued for admin review.");
            } else {
                Log::warning("AI Extraction returned error for {$symbol}.");
            }
        } else {
            Log::error("Python script failed for {$symbol}: ".$process->getErrorOutput());
        }

        // Dispatch SWS metadata fetch job as a follow up
        FetchCompanyMetadataJob::dispatch($company);
    }
}
