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
        $base64Pdf = base64_encode(file_get_contents($pdfPath));

        $prompt = "You are an expert financial analyst. Analyze the attached financial report PDF.
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
  \"published_date\": \"\" // The date of the report (e.g., '2023-12-31' or '31 March 2024')
}";

        $this->info("Sending PDF to Gemini 1.5 Pro... this may take 30-60 seconds depending on the PDF size.");

        $response = Http::timeout(120)->withHeaders([
            'Content-Type' => 'application/json',
        ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={$apiKey}", [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt],
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
            return;
        }

        $data = $response->json();
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $text = trim(str_replace(['```json', '```'], '', $text));
        
        $extractedData = json_decode($text, true);

        if (!$extractedData) {
            $this->error("Failed to parse JSON from Gemini response. Raw output:\n" . $text);
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
        $financials->save();

        // Update AaoifiScreening financial_data_used JSON
        $aaoifi = AaoifiScreening::where('company_id', $company->id)->latest()->first();
        if ($aaoifi) {
            $finDataUsed = is_string($aaoifi->financial_data_used) ? json_decode($aaoifi->financial_data_used, true) : ($aaoifi->financial_data_used ?? []);
            
            $finDataUsed['source'] = "PDF Extraction via Gemini AI";
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

            $aaoifi->financial_data_used = json_encode($finDataUsed);
            $aaoifi->save();
        }

        $this->info("Saved to database. Recalculating AAOIFI compliance...");

        // Compare Market Caps
        $pdfMarketCap = $extractedData['market_cap'] ?? 0;
        $liveMarketCap = $company->market_cap ?? 0;
        
        if ($pdfMarketCap > 0 && $liveMarketCap > 0) {
            $difference = abs($pdfMarketCap - $liveMarketCap) / $liveMarketCap * 100;
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
        
        // Run compliance check
        $newStatus = $aaoifiService->evaluateCompliance($company, $financials);
        
        $this->info("====================================");
        $this->info("Final Status: " . strtoupper($newStatus->status));
        $this->info("Reason: " . $newStatus->reason);
        $this->info("====================================");
    }
}
