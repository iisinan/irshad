<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiAiService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY', '');
    }

    /**
     * Ask Gemini to analyze a company's financials for Shariah compliance.
     */
    public function analyzeCompliance($company, $financials, $status): ?string
    {
        if (empty($this->apiKey)) {
            return "The AI Halal Assistant is currently unavailable because the API key is not configured.";
        }

        $prompt = "You are an expert Islamic Finance AI Assistant. Analyze the following stock and explain its Shariah compliance status in plain English to a retail investor.\n\n";
        $prompt .= "Company: {$company->name} ({$company->symbol})\n";
        $prompt .= "Sector: {$company->sector}\n";
        $prompt .= "Current Status: {$status}\n\n";
        
        if ($financials) {
            $prompt .= "Financial Metrics:\n";
            $prompt .= "- Total Assets: {$financials->total_assets}\n";
            $prompt .= "- Total Debt: {$financials->total_debt}\n";
            $prompt .= "- Interest Income: {$financials->interest_income}\n";
            $prompt .= "- Market Cap: {$financials->market_cap}\n";
            
            // Calculate ratios for the prompt
            $debtRatio = $financials->market_cap > 0 ? ($financials->total_debt / $financials->market_cap) * 100 : 0;
            $prompt .= "- Debt to Market Cap Ratio: " . round($debtRatio, 2) . "%\n";
        }

        $prompt .= "\nAAOIFI Standards Context:\n";
        $prompt .= "1. Conventional Debt to Market Cap must be less than 30%.\n";
        $prompt .= "2. Interest-bearing securities/deposits to Market Cap must be less than 30%.\n";
        $prompt .= "3. Impermissible Income to Total Revenue must be less than 5%.\n\n";

        $prompt .= "Based on the above, explain why this stock is classified as '{$status}'. Keep it concise (1-2 paragraphs), friendly, and use markdown for formatting. Do not hallucinate financial numbers not provided.";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/gemini-flash-latest:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? "Unable to generate analysis at this time.";
            }

            Log::error('Gemini API Error', ['response' => $response->body()]);
            return "The AI Halal Assistant encountered an error analyzing this stock.";
            
        } catch (\Exception $e) {
            Log::error('Gemini API Exception', ['message' => $e->getMessage()]);
            return "The AI Halal Assistant encountered an error connecting to the service.";
        }
    }

    /**
     * Consolidate company data from multiple sources into a Golden Record.
     */
    public function consolidateCompanyData(string $symbol, array $sourcesData): ?array
    {
        if (empty($this->apiKey)) {
            Log::error("Gemini API key is not configured for consolidation.");
            return null;
        }

        $prompt = "You are an expert financial data steward. Below is raw profile data for the stock {$symbol} from multiple sources.\n";
        $prompt .= "Your job is to read them all and produce the single most accurate, standardized output.\n";
        $prompt .= "The 'sector' field MUST be one of standard global financial sectors (e.g. Financials, Consumer Staples, Telecommunications, Healthcare, Energy, Materials, Industrials, Consumer Discretionary, Information Technology, Utilities, Real Estate). DO NOT invent new sectors.\n";
        $prompt .= "The 'description' should be a beautifully written, comprehensive 1-2 paragraph overview combining the best details from the sources.\n\n";
        
        $prompt .= "RAW SOURCES:\n";
        $prompt .= json_encode($sourcesData, JSON_PRETTY_PRINT) . "\n\n";
        
        $prompt .= "Output ONLY valid JSON (no markdown block wrap) with exactly these keys: 'sector', 'industry', 'business_type', 'description'.";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/gemini-flash-latest:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? "";
                
                // Clean up any potential markdown wrap
                $text = str_replace('```json', '', $text);
                $text = str_replace('```', '', $text);
                $text = trim($text);

                return json_decode($text, true);
            }

            Log::error('Gemini Consolidation Error', ['response' => $response->body()]);
            
        } catch (\Exception $e) {
            Log::error('Gemini Consolidation Exception', ['message' => $e->getMessage()]);
        }
        
        return null;
    }
}
