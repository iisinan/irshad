<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiDocumentParserService
{
    /**
     * Send a downloaded PDF to Gemini 1.5 to extract structured financial data.
     * 
     * @param string $pdfFilePath Absolute path to the local PDF file
     * @return array|null An array containing ['total_assets', 'total_debt', 'total_revenue', 'interest_income']
     */
    public function extractFinancialsFromPdf(string $pdfFilePath): ?array
    {
        $apiKey = config('services.gemini.key');
        
        if (empty($apiKey)) {
            Log::error("GEMINI_API_KEY is not set.");
            return null;
        }

        // Use the latest flash model
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" . $apiKey;

        try {
            $fileData = base64_encode(file_get_contents($pdfFilePath));
            
            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'text' => "You are an expert financial analyst. Please read this financial statement and extract the following exact numbers for the most recent period. If a number is missing, try to infer it from related fields (e.g. Finance Income = Interest Income). Return the result ONLY as a raw JSON object with the keys: total_assets, total_debt, total_revenue, interest_income. Do NOT wrap the JSON in markdown formatting blocks like ```json."
                            ],
                            [
                                'inlineData' => [
                                    'mimeType' => str_ends_with($pdfFilePath, '.txt') ? 'text/plain' : 'application/pdf',
                                    'data' => $fileData
                                ]
                            ]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'temperature' => 0.0
                ]
            ];

            // Wait time can be long for large PDFs
            $response = Http::timeout(120)->post($url, $payload);

            if (!$response->successful()) {
                Log::error("Gemini API Error: " . $response->body());
                return null;
            }

            $json = $response->json();
            
            if (isset($json['candidates'][0]['content']['parts'][0]['text'])) {
                $rawText = $json['candidates'][0]['content']['parts'][0]['text'];
                $parsed = json_decode(trim($rawText), true);
                
                if (json_last_error() === JSON_ERROR_NONE) {
                    return [
                        'total_assets' => $parsed['total_assets'] ?? 0,
                        'total_debt' => $parsed['total_debt'] ?? 0,
                        'total_revenue' => $parsed['total_revenue'] ?? 0,
                        'interest_income' => $parsed['interest_income'] ?? 0,
                    ];
                }
            }

            Log::error("Failed to parse Gemini JSON response", ['response' => $json]);
            return null;

        } catch (\Exception $e) {
            Log::error("AiDocumentParserService Error: " . $e->getMessage());
            return null;
        }
    }
}
