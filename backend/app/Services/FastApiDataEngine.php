<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FastApiDataEngine
{
    protected string $baseUrl;

    public function __construct()
    {
        // Default to the docker-compose service name if running locally in docker
        $this->baseUrl = env('AI_ENGINE_URL', 'http://api:8000');
    }

    /**
     * Trigger the full LangGraph AI workflow for a company
     */
    public function screenCompany(string $ticker, int $year = 2024): ?array
    {
        try {
            $response = Http::timeout(300) // LangGraph might take a few minutes
                ->post("{$this->baseUrl}/screen", [
                    'ticker' => $ticker,
                    'financial_year' => $year,
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error("AI Engine API error: " . $response->body());
            return null;

        } catch (\Exception $e) {
            Log::error("Failed to connect to AI Engine: " . $e->getMessage());
            return null;
        }
    }
}
