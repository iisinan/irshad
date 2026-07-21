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
        $apiKeysString = env('GEMINI_API_KEY', '');
        $this->apiKey = $apiKeysString; // Will be parsed dynamically
    }

    private function getNextApiKey(&$currentKeyIndex, $apiKeys)
    {
        $currentKeyIndex++;
        if ($currentKeyIndex >= count($apiKeys)) {
            Log::warning("Gemini Rate Limit Hit (429). All keys exhausted in GeminiAiService.");
            sleep(60);
            $currentKeyIndex = 0;
        }
        \Illuminate\Support\Facades\Cache::put('gemini_key_index', $currentKeyIndex);
        return $apiKeys[$currentKeyIndex];
    }

    /**
     * Ask Gemini to analyze a company's financials for Shariah compliance.
     */
    public function analyzeCompliance($company, $financials, $status): ?string
    {
        if (empty($this->apiKey)) {
            return "The Halal Assistant is currently unavailable because the API key is not configured.";
        }
        
        $apiKeys = array_map('trim', explode(',', $this->apiKey));
        $currentKeyIndex = \Illuminate\Support\Facades\Cache::get('gemini_key_index', 0);
        if (!isset($apiKeys[$currentKeyIndex])) {
            $currentKeyIndex = 0;
        }
        $apiKey = $apiKeys[$currentKeyIndex];

        $prompt = "You are an expert Islamic Finance Assistant. Analyze the following stock and explain its Shariah compliance status in plain English to a retail investor.\n\n";
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

        $maxRetries = 10;
        for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->post("{$this->baseUrl}/gemini-flash-latest:generateContent?key={$apiKey}", [
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

                if ($response->status() == 429) {
                    $apiKey = $this->getNextApiKey($currentKeyIndex, $apiKeys);
                    continue;
                }

                Log::error('Gemini API Error', ['response' => $response->body()]);
                return "The Halal Assistant encountered an error analyzing this stock.";
                
            } catch (\Exception $e) {
                Log::error('Gemini API Exception', ['message' => $e->getMessage()]);
                return "The Halal Assistant encountered an error connecting to the service.";
            }
        }
        return "The Halal Assistant encountered an error analyzing this stock after retries.";
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

        $prompt = "You are an expert Islamic financial data steward and AAOIFI Shariah advisor. Below is raw profile data for the stock {$symbol} from multiple sources.\n";
        $prompt .= "Your job is to read them all and produce the single most accurate, standardized output.\n";
        $prompt .= "The 'sector' field MUST be one of standard global financial sectors (e.g. Financials, Consumer Staples, Telecommunications, Healthcare, Energy, Materials, Industrials, Consumer Discretionary, Information Technology, Utilities, Real Estate).\n";
        $prompt .= "The 'description' should be a beautifully written, comprehensive 1-2 paragraph overview combining the best details from the sources.\n";
        $prompt .= "*** CRITICAL BUSINESS ACTIVITY DETECTION ***\n";
        $prompt .= "You MUST carefully evaluate if the core business activity involves any of the following PROHIBITED activities:\n";
        $prompt .= "- Conventional banking, conventional insurance, or any interest-based financial services.\n";
        $prompt .= "- Production, sale, or distribution of alcohol or pork products.\n";
        $prompt .= "- Gambling, casinos, or betting.\n";
        $prompt .= "- Adult entertainment, pornography, or immoral activities.\n";
        $prompt .= "- Tobacco or weapons/arms manufacturing.\n";
        $prompt .= "If the primary business involves any of these, set 'has_prohibited_activities' to true. Otherwise, false.\n";
        $prompt .= "Provide a 1-2 sentence explanation in 'prohibited_activities_reason' detailing what the core business is and why it has or does not have these prohibited activities.\n\n";
        
        $prompt .= "Additionally, provide the most recent reliable estimates for the following financial metrics for the exchange. You MUST estimate these numerically based on your deep knowledge of stocks, or use the sources if provided.\n";
        $prompt .= "If you do not know the exact number, provide your best reasonable estimate for a recent trailing 12 month period. DO NOT output null for financials if possible.\n\n";
        
        $prompt .= "Finally, provide two short qualitative text summaries (1-2 sentences each) based on the financial metrics:\n";
        $prompt .= "- 'valuation_info': Analyze the valuation (e.g. 'Undervalued with a P/E of X, trading below industry peers').\n";
        $prompt .= "- 'growth_info': Analyze the growth prospects (e.g. 'Expected strong revenue growth due to recent expansions').\n\n";

        $prompt .= "RAW SOURCES:\n";
        $prompt .= json_encode($sourcesData, JSON_PRETTY_PRINT) . "\n\n";
        
        $prompt .= "Output ONLY valid JSON (no markdown block wrap) with exactly these keys:\n";
        $prompt .= "'sector', 'industry', 'business_type', 'description', 'has_prohibited_activities' (boolean), 'prohibited_activities_reason' (string), 'eps', 'pe_ratio', 'roe', 'dividend_yield', 'profit_margin', 'market_cap', 'total_assets', 'total_debt', 'total_revenue', 'interest_income', 'valuation_info', 'growth_info'.\n";
        $prompt .= "For percentages (roe, dividend_yield, profit_margin), use decimals (e.g. 0.05 for 5%). For absolute values, use raw numbers (e.g. 5000000000).";

        $apiKeys = array_map('trim', explode(',', $this->apiKey));
        $currentKeyIndex = \Illuminate\Support\Facades\Cache::get('gemini_key_index', 0);
        if (!isset($apiKeys[$currentKeyIndex])) {
            $currentKeyIndex = 0;
        }
        $apiKey = $apiKeys[$currentKeyIndex];

        $maxRetries = 10;
        for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
            try {
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->timeout(60)->post("{$this->baseUrl}/gemini-flash-latest:generateContent?key={$apiKey}", [
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

                if ($response->status() == 429) {
                    $apiKey = $this->getNextApiKey($currentKeyIndex, $apiKeys);
                    continue;
                }

                Log::error('Gemini Consolidation Error', ['response' => $response->body()]);
                return null;
                
            } catch (\Exception $e) {
                Log::error('Gemini Consolidation Exception', ['message' => $e->getMessage()]);
                return null;
            }
        }
        
        return null;
    }

    /**
     * Analyze a product image (ingredients list) and optional text using Gemini Vision.
     */
    public function analyzeProductImage(string $imagePath, ?string $ingredientsText): ?array
    {
        if (empty($this->apiKey)) {
            Log::error("Gemini API key is not configured for vision analysis.");
            return null;
        }

        $fullPath = storage_path('app/public/' . $imagePath);
        if (!file_exists($fullPath)) {
            Log::error("Image file not found at path: " . $fullPath);
            return null;
        }

        $mimeType = mime_content_type($fullPath) ?: 'image/jpeg';
        $base64Image = base64_encode(file_get_contents($fullPath));

        $prompt = "You are an expert Islamic dietary scholar. Please analyze the ingredients in this product.\n";
        if (!empty($ingredientsText)) {
            $prompt .= "The user also provided this text description of ingredients: \"{$ingredientsText}\"\n";
        }
        $prompt .= "Carefully read all ingredients from the image. If there are NO ingredients visible in the image, set 'status' to 'doubtful' and state that no ingredients were visible.\n";
        $prompt .= "Look out for prohibited items (pork, alcohol, carmine, non-halal gelatin) and doubtful items (E471, mono- and diglycerides, whey, pepsin, rennet).\n";
        $prompt .= "Respond ONLY with a valid JSON object with the following keys:\n";
        $prompt .= "- 'status': Must be exactly 'halal', 'non-halal', or 'doubtful'.\n";
        $prompt .= "- 'status_reason': A clear, friendly explanation (1-2 sentences) of why this status was chosen, mentioning any specific ingredients found.\n";
        $prompt .= "- 'ingredients_text': The extracted list of ingredients from the image, combined with the user's text if applicable.\n";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->timeout(60)->post("{$this->baseUrl}/gemini-1.5-flash:generateContent?key={$this->apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                            [
                                'inlineData' => [
                                    'mimeType' => $mimeType,
                                    'data' => $base64Image
                                ]
                            ]
                        ]
                    ]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? "";
                
                $text = str_replace('```json', '', $text);
                $text = str_replace('```', '', $text);
                $text = trim($text);

                return json_decode($text, true);
            }

            Log::error('Gemini Vision Error', ['response' => $response->body()]);
            
        } catch (\Exception $e) {
            Log::error('Gemini Vision Exception', ['message' => $e->getMessage()]);
        }
        
        return null;
    }
}
