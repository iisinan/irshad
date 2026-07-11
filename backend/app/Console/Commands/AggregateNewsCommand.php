<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\News;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use SimpleXMLElement;

class AggregateNewsCommand extends Command
{
    protected $signature = 'news:aggregate';
    protected $description = 'Aggregates news from various RSS feeds (Nairametrics, BusinessDay, Investing.com)';

    protected $feeds = [
        'BusinessDay' => 'https://businessday.ng/feed/',
    ];

    public function handle()
    {
        $this->info("Starting news aggregation...");

        foreach ($this->feeds as $source => $url) {
            $this->info("Fetching feed from {$source}...");
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(5)
                    ->withHeaders(['User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'])
                    ->get($url);
                
                if ($response->successful()) {
                    $xml = simplexml_load_string($response->body(), 'SimpleXMLElement', LIBXML_NOCDATA);
                    
                    if ($xml && isset($xml->channel->item)) {
                        $count = 0;
                        foreach ($xml->channel->item as $item) {
                            $title = (string) $item->title;
                            $link = (string) $item->link;
                            $pubDate = (string) $item->pubDate;
                            $description = strip_tags((string) $item->description);
                            $excerpt = substr($description, 0, 200) . (strlen($description) > 200 ? '...' : '');

                            // Extract thumbnail if available
                            $thumbnailUrl = null;
                            
                            // Handle standard media:content
                            $media = $item->children('media', true);
                            if ($media && isset($media->content)) {
                                $thumbnailUrl = (string) $media->content->attributes()->url;
                            } 
                            // Handle Nairametrics/WP specific enclosed images
                            elseif (isset($item->enclosure)) {
                                $thumbnailUrl = (string) $item->enclosure->attributes()->url;
                            }
                            
                            // Parse date
                            $publishedAt = null;
                            try {
                                if ($pubDate) {
                                    $publishedAt = Carbon::parse($pubDate)->toDateTimeString();
                                }
                            } catch (\Exception $e) {
                                $publishedAt = Carbon::now()->toDateTimeString();
                            }

                            // Save if it doesn't exist
                            $news = News::firstOrCreate(
                                ['url' => $link],
                                [
                                    'title' => $title,
                                    'source' => $source,
                                    'thumbnail_url' => $thumbnailUrl,
                                    'published_at' => $publishedAt,
                                    'excerpt' => $excerpt,
                                ]
                            );

                            if ($news->wasRecentlyCreated) {
                                $count++;
                            }
                        }
                        $this->info("Added {$count} new articles from {$source}.");
                    }
                } else {
                     $this->error("HTTP request failed for {$source}. Status: " . $response->status());
                }
            } catch (\Exception $e) {
                $this->error("Failed to fetch/parse {$source}: " . $e->getMessage());
                Log::error("News Aggregation Error [{$source}]: " . $e->getMessage());
            }
        }

        $this->info("News aggregation complete.");
    }
}
