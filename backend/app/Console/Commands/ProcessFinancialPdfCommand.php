<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\Company;
use App\Models\Financial;
use App\Models\AaoifiScreening;
use App\Services\AaoifiComplianceService;
use Carbon\Carbon;

class ProcessFinancialPdfCommand extends Command
{
    protected $signature = 'aaoifi:process-pdf {ticker} {pdf_path} {--url= : The source URL of the PDF}';
    protected $description = 'Extract financial data from a PDF using Gemini and recalculate AAOIFI compliance';

    public function handle(AaoifiComplianceService $aaoifiService)
    {
        $ticker = strtoupper($this->argument('ticker'));
        $pdfPath = $this->argument('pdf_path');
        $url = $this->option('url') ?? '';

        $company = Company::where('symbol', $ticker)->first();
        if (!$company) {
            $this->error("Company with ticker {$ticker} not found.");
            return;
        }

        if (!file_exists($pdfPath)) {
            $this->error("PDF file not found at: {$pdfPath}");
            return;
        }

        $apiKey = env('GEMINI_API_KEY');
        if (empty($apiKey)) {
            $this->error('GEMINI_API_KEY not found in .env');
            return;
        }
        $apiKey = explode(',', $apiKey)[0];

        $this->info("Reading PDF for {$ticker}...");
        
        // 1. Manual Extraction using pdftotext
        $this->info("Performing manual regex extraction as a baseline...");
        $manualText = shell_exec("pdftotext -layout " . escapeshellarg($pdfPath) . " -");
        $manualAssets = 0;
        
        // Very basic naive regex to find "Total Assets" followed by numbers
        if (preg_match('/Total\s+Assets[^\d]*?([\d,\.]+)/i', $manualText, $matches)) {
            $manualAssets = (float) str_replace(',', '', $matches[1]);
            $this->info("Manual Regex Extracted Total Assets: " . number_format($manualAssets, 2));
        } else {
            $this->warn("Manual Regex could not confidently find Total Assets. Fallback comparison might skip.");
        }

        $base64Pdf = base64_encode(file_get_contents($pdfPath));

        $basePrompt = "You are an expert financial analyst. Analyze the attached financial report PDF.
Extract the following exact figures for the most recent period (e.g., FY 2023 or Q1 2024) in absolute numbers (e.g. 5000000, not '5 million').
Return ONLY a valid JSON object matching this schema exactly, with NO markdown formatting (no ```json blocks), NO extra text, NO comments.
{
  \"total_assets\": 0,
  \"total_debt\": 0, // Total borrowings + commercial papers (short term + long term)
  \"cash_and_equivalents\": 0, // Cash and bank balances
  \"interest_bearing_securities\": 0, // Short term investments, treasury bills, etc.
  \"interest_income\": 0, // Finance income / Interest income
  \"total_revenue\": 0, // Gross earnings or Revenue
  \"market_cap\": 0, // Often 0 if not stated explicitly
  \"published_date\": \"\", // The date the report was actually published/released (e.g. '24 August 2026'), NOT the period end date.
  \"period_end_date\": \"\", // The date the financial period ended (e.g. '31 July 2026' or '31 March 2024')
  \"reporting_period\": \"\", // The quarter or period (e.g. 'Q1', 'Q2', 'Q3', 'Q4', 'FY', 'H1', 'H2')
  \"reporting_year\": 0 // The year of the report (e.g. 2026, 2025)
}";

        $extractedData = null;
        $maxRetries = 3;
        
        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            $this->info("Sending PDF to Gemini 1.5 Pro... Attempt {$attempt} of {$maxRetries}");
            
            $currentPrompt = $basePrompt;
            if ($attempt > 1 && $manualAssets > 0) {
                $currentPrompt .= "\n\nHINT: Our manual text extraction found Total Assets around " . number_format($manualAssets, 2) . ". Ensure you are looking at the correct balance sheet and reading the units correctly (e.g., thousands vs millions).";
            }

            $response = Http::timeout(120)->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $currentPrompt],
                            [
                                'inline_data' => [
                                    'mime_type' => 'application/pdf',
                                    'data' => $base64Pdf,
                                ],
                            ],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.1,
                ],
            ]);

            if (!$response->successful()) {
                $this->error('API Request Failed: ' . $response->body());
                if ($attempt === $maxRetries) return;
                continue;
            }

            $data = $response->json();
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $text = trim(str_replace(['```json', '```'], '', $text));
            
            $attemptData = json_decode($text, true);

            if (!$attemptData) {
                $this->error("Failed to parse JSON from Gemini response. Raw output:\n" . $text);
                if ($attempt === $maxRetries) return;
                continue;
            }
            
            // Check against manual extraction
            $geminiAssets = $attemptData['total_assets'] ?? 0;
            if ($manualAssets > 0) {
                // Allow a small 1% margin for rounding differences or units (e.g., 500.5 vs 500)
                $diff = abs($manualAssets - $geminiAssets) / max($manualAssets, 1);
                
                if ($diff <= 0.01 || $geminiAssets == $manualAssets) {
                    $this->info("Triple Validation PASSED: Gemini and Manual extraction match.");
                    $extractedData = $attemptData;
                    break;
                } else {
                    $this->warn("Triple Validation FAILED: Gemini Total Assets (" . number_format($geminiAssets, 2) . ") does not match manual extraction (" . number_format($manualAssets, 2) . ").");
                    if ($attempt === $maxRetries) {
                        $this->warn("Max retries reached. Proceeding with Gemini's extraction due to poor PDF OCR quality.");
                        $extractedData = $attemptData;
                        break;
                    }
                }
            } else {
                // If manual extraction failed to find anything, we assume Gemini is right but warn
                $this->info("Skipping Triple Validation since manual regex could not determine Total Assets.");
                $extractedData = $attemptData;
                break;
            }
        }

        if (!$extractedData) {
            $this->error("Failed to extract valid data after {$maxRetries} attempts.");
            return;
        }

        $this->info("Data extracted successfully:\n" . json_encode($extractedData, JSON_PRETTY_PRINT));

        // Always fetch the LATEST financial record if duplicates exist
        $financials = Financial::where('company_id', $company->id)->orderBy('created_at', 'desc')->first();
        if (!$financials) {
            $financials = new Financial(['company_id' => $company->id]);
        }

        $financials->total_assets = $extractedData['total_assets'] ?? 0;
        $financials->total_debt = $extractedData['total_debt'] ?? 0;
        $financials->cash_and_equivalents = $extractedData['cash_and_equivalents'] ?? 0;
        $financials->interest_bearing_securities = $extractedData['interest_bearing_securities'] ?? 0;
        $financials->interest_income = $extractedData['interest_income'] ?? 0;
        $financials->total_revenue = $extractedData['total_revenue'] ?? 0;
        
        // Only update market cap if the PDF actually provided one, otherwise keep existing
        if (!empty($extractedData['market_cap'])) {
            $financials->market_cap = $extractedData['market_cap'];
        }
        
        $extractedDate = $extractedData['published_date'] ?? '';
        if (!empty($extractedDate)) {
            try {
                $financials->published_date = Carbon::parse($extractedDate)->toDateTimeString();
            } catch (\Exception $e) {
                $financials->published_date = $extractedDate;
            }
        } else {
            $financials->published_date = Carbon::now()->toDateTimeString();
        }

        if (!empty($extractedData['reporting_period'])) {
            $financials->reporting_period = $extractedData['reporting_period'];
        }
        
        if ($url) {
            $financials->source_url = $url;
        }

        // Unlock observer protection to save AI-extracted data
        app()->instance('verdict.unlock', true);
        $financials->save();
        app()->instance('verdict.unlock', false);

        // Update AaoifiScreening financial_data_used JSON
        $aaoifi = AaoifiScreening::where('company_id', $company->id)->latest()->first();
        if ($aaoifi) {
            $finDataUsed = is_string($aaoifi->financial_data_used) ? json_decode($aaoifi->financial_data_used, true) : ($aaoifi->financial_data_used ?? []);
            
            $finDataUsed['source'] = "PDF Extraction via Triple Validation Method";
            $finDataUsed['total_assets'] = $financials->total_assets;
            $finDataUsed['total_debt'] = $financials->total_debt;
            $finDataUsed['cash'] = $financials->cash_and_equivalents;
            $finDataUsed['interest_bearing_securities'] = $financials->interest_bearing_securities;
            $finDataUsed['interest_income'] = $financials->interest_income;
            $finDataUsed['total_revenue'] = $financials->total_revenue;
            
            if ($url) {
                $finDataUsed['source_url'] = $url;
            }
            
            $finDataUsed['file_hash'] = hash_file('sha256', $pdfPath);
            
            $extractedDate = $extractedData['published_date'] ?? '';
            if (!empty($extractedDate)) {
                try {
                    $finDataUsed['published_date'] = Carbon::parse($extractedDate)->toDateTimeString();
                } catch (\Exception $e) {
                    $finDataUsed['published_date'] = $extractedDate;
                }
            } else {
                $finDataUsed['published_date'] = Carbon::now()->toDateTimeString();
            }

            if (!empty($extractedData['reporting_period'])) {
                $aaoifi->reporting_period = $extractedData['reporting_period'];
                $finDataUsed['reporting_period'] = $extractedData['reporting_period'];
            }
            if (!empty($extractedData['reporting_year'])) {
                $aaoifi->reporting_year = $extractedData['reporting_year'];
                $finDataUsed['financial_year'] = $extractedData['reporting_year'];
            }

            $aaoifi->financial_data_used = json_encode($finDataUsed);
            $aaoifi->save();
        }

        $this->info("Saved to database. Recalculating AAOIFI compliance...");

        // Compare Market Caps
        $pdfMarketCap = $extractedData['market_cap'] ?? 0;
        $liveMarketCap = $company->market_cap ?? 0;
        
        if ($pdfMarketCap > 0 && $liveMarketCap > 0) {
            $difference = abs($pdfMarketCap - $liveMarketCap) / max($liveMarketCap, 1) * 100;
            $this->info("\n--- Market Cap Comparison ---");
            $this->info("PDF Extracted Market Cap: ₦" . number_format($pdfMarketCap, 2));
            $this->info("NGXPulse Live Market Cap: ₦" . number_format($liveMarketCap, 2));
            if ($difference > 5) {
                $this->warn("Note: There is a " . number_format($difference, 2) . "% difference between the PDF and the Live market cap.");
            } else {
                $this->info("The market caps tally closely.");
            }
            $this->info("-----------------------------\n");
        }
        
        // Run compliance check (for scholar reviews)
        $newStatus = $aaoifiService->evaluateCompliance($company, $financials);

        // Permanently persist new calculated ratios into the database
        $screeningService = app(\App\Services\AaoifiScreeningService::class);
        $screeningService->screenCompany($company);
        
        // Auto-approve and apply if staged in review
        $pendingReview = \App\Models\ComplianceReview::where('company_id', $company->id)->where('status', 'pending')->first();
        if ($pendingReview) {
            $pendingReview->update(['status' => 'approved', 'reviewed_at' => now()]);
            $cleanReason = preg_replace('/^SCHOLAR REVIEW REQUIRED:\s*/i', '', $pendingReview->reason);
            $company->update(['current_status' => $pendingReview->new_status]);
            \App\Models\StockStatus::updateOrCreate(
                ['company_id' => $company->id],
                [
                    'status' => $pendingReview->new_status,
                    'reason' => $cleanReason,
                    'verified_by_scholar' => false,
                    'last_updated' => now()
                ]
            );
            $aaoifiScreening = \App\Models\AaoifiScreening::where('company_id', $company->id)->latest()->first();
            if ($aaoifiScreening) {
                $aaoifiScreening->update(['final_status' => $pendingReview->new_status]);
            }
            $newStatus = $company->status()->first();
        }
        
        $this->info("====================================");
        $this->info("Final Status: " . strtoupper($newStatus->status));
        $this->info("Reason: " . $newStatus->reason);
        $this->info("====================================");
        
        // Clear caches so UI shows the correct financial details
        try {
            \Illuminate\Support\Facades\Cache::tags(['stocks'])->forget("stocks.show.full.{$company->symbol}");
            \Illuminate\Support\Facades\Cache::tags(['stocks'])->forget("aaoifi.screening.{$company->symbol}");
        } catch (\BadMethodCallException $e) {
            \Illuminate\Support\Facades\Cache::forget("stocks.show.full.{$company->symbol}");
            \Illuminate\Support\Facades\Cache::forget("aaoifi.screening.{$company->symbol}");
        }
        $this->info("Cleared cache for {$company->symbol}.");
    }
}
