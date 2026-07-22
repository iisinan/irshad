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
        $apiKeysString = config('services.gemini.key');
        
        if (empty($apiKeysString)) {
            Log::error("GEMINI_API_KEY is not set.");
            return null;
        }

        $apiKeys = array_map('trim', explode(',', $apiKeysString));
        $currentKeyIndex = \Illuminate\Support\Facades\Cache::get('gemini_key_index', 0);
        if (!isset($apiKeys[$currentKeyIndex])) {
            $currentKeyIndex = 0;
        }
        $apiKey = $apiKeys[$currentKeyIndex];
        
        // Actively alternate for the next request
        $nextKeyIndex = ($currentKeyIndex + 1) % count($apiKeys);
        \Illuminate\Support\Facades\Cache::put('gemini_key_index', $nextKeyIndex);
        $baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=";
        $url = $baseUrl . $apiKey;

        try {
            $mimeType = str_ends_with($pdfFilePath, '.txt') ? 'text/plain' : 'application/pdf';
            
            // 1. Upload File to Gemini using stream to save memory
            $uploadUrl = "https://generativelanguage.googleapis.com/upload/v1beta/files?key=" . $apiKey;
            
            $fileSize = filesize($pdfFilePath);
            $fileResource = fopen($pdfFilePath, 'r');
            
            $ch = curl_init($uploadUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 300);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'X-Goog-Upload-Command: start, upload, finalize',
                'X-Goog-Upload-Header-Content-Length: ' . $fileSize,
                'X-Goog-Upload-Header-Content-Type: ' . $mimeType,
                'Content-Type: ' . $mimeType,
            ]);
            // Use INFILE for streaming the upload directly from disk to network
            curl_setopt($ch, CURLOPT_PUT, true); // Required for CURLOPT_INFILE
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST'); // Override back to POST
            curl_setopt($ch, CURLOPT_INFILE, $fileResource);
            curl_setopt($ch, CURLOPT_INFILESIZE, $fileSize);

            $responseBody = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);
            fclose($fileResource);

            if ($httpCode >= 400 || $responseBody === false) {
                Log::error("Gemini File Upload Failed. HTTP {$httpCode}. Error: {$curlError}. Body: " . $responseBody);
                return null;
            }

            $uploadData = json_decode($responseBody, true);
            $fileUri = $uploadData['file']['uri'] ?? null;
            $fileName = $uploadData['file']['name'] ?? null; // To delete later

            if (!$fileUri) {
                Log::error("Gemini File Upload did not return a URI.");
                return null;
            }

            // 2. Generate Content using the File URI
            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'text' => "You are an expert financial analyst. Please read this financial statement and extract the exact financial metrics for the most recent period. If a number is missing, try to infer it from related fields (e.g. Finance Income = Interest Income). Return the result as JSON."
                            ],
                            [
                                'fileData' => [
                                    'mimeType' => $mimeType,
                                    'fileUri' => $fileUri
                                ]
                            ]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'responseSchema' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'total_assets' => ['type' => 'NUMBER'],
                            'total_debt' => ['type' => 'NUMBER'],
                            'total_revenue' => ['type' => 'NUMBER'],
                            'interest_income' => ['type' => 'NUMBER'],
                            'eps' => ['type' => 'NUMBER'],
                            'pe_ratio' => ['type' => 'NUMBER'],
                            'roe' => ['type' => 'NUMBER'],
                            'dividend_yield' => ['type' => 'NUMBER'],
                            'profit_margin' => ['type' => 'NUMBER'],
                            'cash_and_equivalents' => ['type' => 'NUMBER'],
                            'interest_bearing_securities' => ['type' => 'NUMBER'],
                            'accounts_receivable' => ['type' => 'NUMBER'],
                            'illiquid_assets' => ['type' => 'NUMBER']
                        ]
                    ],
                    'temperature' => 0.0
                ]
            ];

            $maxRetries = 10;
            $generateSuccess = false;
            $generateResponse = null;

            for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
                $response = Http::timeout(300)->post($url, $payload);

                if ($response->successful()) {
                    $generateSuccess = true;
                    $generateResponse = $response;
                    break;
                }

                if ($response->status() == 429) {
                    Log::warning("Gemini Rate Limit Hit (429). Attempt " . ($attempt + 1));
                    sleep(20);
                    continue;
                }

                if ($response->status() >= 500) {
                    Log::warning("Gemini API Error ({$response->status()}). Attempt " . ($attempt + 1));
                    sleep(10);
                    continue;
                }

                Log::error("Gemini API Error: " . $response->body());
                break;
            }

            // 3. Clean up the file from Gemini servers
            if ($fileName) {
                Http::delete("https://generativelanguage.googleapis.com/v1beta/{$fileName}?key={$apiKey}");
            }

            if (!$generateSuccess) {
                Log::error("Gemini API failed after retries.");
                return null;
            }

            $response = $generateResponse;

            if (!$response->successful()) {
                echo "Gemini API failed after retries: " . $response->body() . "\n";
                Log::error("Gemini API failed after retries: " . $response->body());
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
                        'eps' => $parsed['eps'] ?? null,
                        'pe_ratio' => $parsed['pe_ratio'] ?? null,
                        'roe' => $parsed['roe'] ?? null,
                        'dividend_yield' => $parsed['dividend_yield'] ?? null,
                        'profit_margin' => $parsed['profit_margin'] ?? null,
                        'cash_and_equivalents' => $parsed['cash_and_equivalents'] ?? 0,
                        'interest_bearing_securities' => $parsed['interest_bearing_securities'] ?? 0,
                        'accounts_receivable' => $parsed['accounts_receivable'] ?? 0,
                        'illiquid_assets' => $parsed['illiquid_assets'] ?? 0,
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
