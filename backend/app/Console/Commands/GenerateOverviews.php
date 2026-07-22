<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerateOverviews extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'data:generate-overviews';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate missing company overviews using Gemini API';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $companies = Company::whereNull('overview')->orWhere('overview', '')->get();
        $this->info("Found {$companies->count()} companies missing overviews.");

        if ($companies->isEmpty()) {
            return Command::SUCCESS;
        }

        $apiKeysString = config('services.gemini.key');
        if (empty($apiKeysString)) {
            $this->error("GEMINI_API_KEY is not set.");
            return Command::FAILURE;
        }

        $apiKeys = array_map('trim', explode(',', $apiKeysString));
        $currentKeyIndex = \Illuminate\Support\Facades\Cache::get('gemini_key_index', 0);
        if (!isset($apiKeys[$currentKeyIndex])) {
            $currentKeyIndex = 0;
        }
        
        $generated = 0;

        foreach ($companies as $company) {
            $this->info("Generating overview for: {$company->name} ({$company->symbol})");
            
            $apiKey = $apiKeys[$currentKeyIndex];
            $baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=";
            $url = $baseUrl . $apiKey;

            $prompt = "Write a concise, 2-3 sentence business overview for the Nigerian company: {$company->name} (Ticker: {$company->symbol}). Focus on what they do, their industry, and their main products or services. Do not include introductory phrases like 'Here is an overview', just return the plain text overview. If you don't know the company, just guess based on the name and the fact that they are a Nigerian stock exchange listed company.";

            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.2
                ]
            ];

            try {
                $response = Http::timeout(30)->post($url, $payload);
                
                if ($response->status() == 429) {
                    $this->warn("Rate limit hit. Sleeping for 5 seconds...");
                    sleep(5);
                    $currentKeyIndex = ($currentKeyIndex + 1) % count($apiKeys);
                    \Illuminate\Support\Facades\Cache::put('gemini_key_index', $currentKeyIndex);
                    continue; // Will try this company again on next run if we don't implement retry here
                }
                
                if ($response->successful()) {
                    $json = $response->json();
                    if (isset($json['candidates'][0]['content']['parts'][0]['text'])) {
                        $overview = trim($json['candidates'][0]['content']['parts'][0]['text']);
                        
                        $company->update(['overview' => $overview]);
                        $this->line(" ✓ Saved overview for {$company->symbol}");
                        $generated++;
                    }
                } else {
                    $this->error("API Error: " . $response->body());
                }
                
            } catch (\Exception $e) {
                $this->error("Exception: " . $e->getMessage());
            }
            
            // Sleep slightly to avoid rate limits
            usleep(500000); 
        }

        $this->info("Generated {$generated} overviews successfully.");
        return Command::SUCCESS;
    }
}
