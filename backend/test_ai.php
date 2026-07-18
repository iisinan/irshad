<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$pdfFilePath = 'temp.pdf';
if (!file_exists($pdfFilePath)) {
    echo "No PDF.\n"; exit;
}

$apiKey = config('services.gemini.key');
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" . $apiKey;

$fileData = base64_encode(file_get_contents($pdfFilePath));

$payload = [
    'contents' => [
        [
            'parts' => [
                [
                    'text' => "You are an expert financial analyst. Please read this financial statement and extract the following exact numbers for the most recent period. If a number is missing, try to infer it from related fields (e.g. Finance Income = Interest Income). Return the result ONLY as a raw JSON object with the keys: total_assets, total_debt, total_revenue, interest_income, eps, pe_ratio, roe, dividend_yield, profit_margin. Do NOT wrap the JSON in markdown formatting blocks like ```json."
                ],
                [
                    'inlineData' => [
                        'mimeType' => 'application/pdf',
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

$response = \Illuminate\Support\Facades\Http::timeout(120)->post($url, $payload);
echo "Status: " . $response->status() . "\n";
echo "Body: " . substr($response->body(), 0, 1000) . "\n";
