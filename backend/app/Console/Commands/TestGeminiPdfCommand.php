<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TestGeminiPdfCommand extends Command
{
    protected $signature = 'test:gemini-pdf {path}';
    protected $description = 'Test extracting financial ratios from a raw PDF using Gemini 1.5 Pro';

    public function handle()
    {
        $pdfPath = $this->argument('path');
        if (!file_exists($pdfPath)) {
            $this->error("File not found: " . $pdfPath);
            return;
        }

        $this->info("Reading PDF: " . $pdfPath);
        $base64Pdf = base64_encode(file_get_contents($pdfPath));

        $apiKey = env('GEMINI_API_KEY');
        if (empty($apiKey)) {
            $this->error("GEMINI_API_KEY not found in .env");
            return;
        }

        // Handle multiple keys if configured that way
        $apiKeys = array_map('trim', explode(',', $apiKey));
        $apiKey = $apiKeys[0];

        $prompt = "You are an expert financial analyst. Please analyze the attached financial report.
Extract the following exact figures for the most recent period (e.g. Q1 2024 or FY 2023) in absolute values:
1. Total Revenue
2. Total Debt (Total borrowings + any commercial papers)
3. Total Cash (Cash + Securities/Short-term Investments)
4. Interest Income (or Financial Income)

Output the results clearly. If you have to calculate Total Debt or Total Cash, show your math (e.g., 'Total Debt = Borrowings (X) + Commercial Papers (Y) = Z').";

        $this->info("Sending PDF to Gemini 1.5 Pro... this may take 30-60 seconds depending on the PDF size.");

        $response = Http::timeout(120)->withHeaders([
            'Content-Type' => 'application/json',
        ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={$apiKey}", [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt],
                        [
                            'inline_data' => [
                                'mime_type' => 'application/pdf',
                                'data' => $base64Pdf
                            ]
                        ]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.1,
            ]
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No text returned';
            $this->info("\n--- GEMINI EXTRACTION RESULTS ---\n");
            $this->line($text);
            $this->info("\n---------------------------------\n");
        } else {
            $this->error("API Request Failed: " . $response->body());
        }
    }
}
