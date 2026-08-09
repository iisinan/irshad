<?php
require __DIR__.'/vendor/autoload.php';
use Illuminate\Support\Facades\Http;
$apiKey = env('GEMINI_API_KEY');
$response = Http::withHeaders(['Content-Type' => 'application/json'])
    ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey, [
        'contents' => [['parts' => [['text' => 'Hello']]]]
    ]);
echo $response->body();
