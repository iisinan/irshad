<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Resource;
use Illuminate\Support\Facades\Http;

class FetchResourcesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fetch:resources';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch latest Islamic finance videos and documents from trusted sources.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting resource fetch...");

        $apiKey = config('services.youtube.key');
        
        if (!$apiKey) {
            $this->warn("No YouTube API Key found. Seeding dummy data instead...");
            $this->seedDummyData();
            return;
        }

        $this->info("Fetching from YouTube API...");
        
        // Trusted channels or generic safe queries
        $queries = ['Halal Investing', 'Islamic Finance', 'Zakat on Shares', 'AAOIFI Standards'];
        
        foreach ($queries as $query) {
            $response = Http::get('https://www.googleapis.com/youtube/v3/search', [
                'part' => 'snippet',
                'q' => $query,
                'type' => 'video',
                'maxResults' => 5,
                'videoEmbeddable' => 'true',
                'key' => $apiKey
            ]);

            if ($response->successful() && isset($response->json()['items'])) {
                $items = $response->json()['items'];
                foreach ($items as $item) {
                    Resource::updateOrCreate(
                        ['external_id' => $item['id']['videoId']],
                        [
                            'title' => $item['snippet']['title'],
                            'scholar' => $item['snippet']['channelTitle'],
                            'type' => 'video',
                            'thumbnail' => $item['snippet']['thumbnails']['high']['url'] ?? null,
                            'url' => 'https://www.youtube.com/embed/' . $item['id']['videoId'],
                            'category' => 'General',
                        ]
                    );
                }
            } else {
                $this->error("YouTube API error for query: {$query}");
            }
        }

        $this->info("Resources fetched successfully.");
    }

    private function seedDummyData()
    {
        $dummies = [
            [
                'title' => 'Principles of Halal Investing (Fetched)',
                'scholar' => 'Mufti Taqi Usmani',
                'duration' => '45 mins',
                'type' => 'video',
                'thumbnail' => 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800',
                'url' => 'https://www.youtube.com/embed/tgbNymZ7vqY',
                'category' => 'Foundations',
                'external_id' => 'dummy_1'
            ],
            [
                'title' => 'AAOIFI Shariah Standard No. 21 (Fetched)',
                'scholar' => 'AAOIFI Board',
                'duration' => 'PDF Document',
                'type' => 'document',
                'thumbnail' => null,
                'url' => 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                'category' => 'Standards',
                'external_id' => 'dummy_2'
            ]
        ];

        foreach ($dummies as $data) {
            Resource::updateOrCreate(['external_id' => $data['external_id']], $data);
        }

        $this->info("Dummy resources seeded successfully.");
    }
}
