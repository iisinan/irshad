<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

$apiKey = config('services.gemini.key');
$apiKeys = explode(',', $apiKey);
$apiKey = trim($apiKeys[0]);

$pdfFilePath = __DIR__ . '/storage/app/test.txt';
file_put_contents($pdfFilePath, "Hello Gemini, this is a test file to upload.");

$mimeType = 'text/plain';

$fileResource = fopen($pdfFilePath, 'r');

$response = Http::withHeaders([
    'X-Goog-Upload-Command' => 'start, upload, finalize',
    'X-Goog-Upload-Header-Content-Length' => filesize($pdfFilePath),
    'X-Goog-Upload-Header-Content-Type' => $mimeType,
    'Content-Type' => $mimeType,
])->send('POST', "https://generativelanguage.googleapis.com/upload/v1beta/files?key={$apiKey}", [
    'body' => $fileResource
]);

echo $response->status() . "\n";
echo $response->body() . "\n";
