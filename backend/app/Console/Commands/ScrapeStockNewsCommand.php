<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use App\Models\News;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class ScrapeStockNewsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'news:scrape-stocks';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scrapes stock-specific news from Google News RSS for all tracked companies.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting stock-specific news aggregation...");

        $companies = Company::all();
        $this->info("Found {$companies->count()} companies to process.");

        foreach ($companies as $company) {
            $this->info("Fetching news for {$company->symbol} ({$company->name})...");

            // Create a focused search query prioritizing BusinessDay and general Nigerian Stock news
            $query = urlencode("\"{$company->name}\" OR \"{$company->symbol}\" (site:businessday.ng OR \"Nigeria Stock\")");
            $url = "https://news.google.com/rss/search?q={$query}&hl=en-NG&gl=NG&ceid=NG:en";

            try {
                $response = Http::timeout(10)
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
                            
                            // Google News puts the source at the end of the title or in <source> tag
                            $sourceName = isset($item->source) ? (string) $item->source : 'Google News';

                            // Clean up title (remove the " - Source" suffix if it exists)
                            $title = preg_replace('/ - ' . preg_quote($sourceName, '/') . '$/', '', $title);

                            $description = strip_tags((string) $item->description);
                            $excerpt = substr($description, 0, 200) . (strlen($description) > 200 ? '...' : '');

                            $publishedAt = null;
                            try {
                                if ($pubDate) {
                                    $publishedAt = Carbon::parse($pubDate)->toDateTimeString();
                                }
                            } catch (\Exception $e) {
                                $publishedAt = Carbon::now()->toDateTimeString();
                            }

                            // Save and associate with the company
                            $news = News::firstOrCreate(
                                ['url' => $link],
                                [
                                    'title' => $title,
                                    'source' => $sourceName,
                                    'thumbnail_url' => null, // Google News RSS rarely provides reliable thumbnails
                                    'published_at' => $publishedAt,
                                    'excerpt' => $excerpt,
                                    'company_id' => $company->id,
                                ]
                            );

                            // If we just created it, or if company_id wasn't set on an existing article, update it.
                            if ($news->wasRecentlyCreated) {
                                $count++;
                            } elseif ($news->company_id !== $company->id) {
                                $news->update(['company_id' => $company->id]);
                            }
                        }
                        $this->info(" -> Added {$count} new articles for {$company->symbol}.");
                    }
                } else {
                    $this->error(" -> HTTP request failed. Status: " . $response->status());
                }
            } catch (\Exception $e) {
                $this->error(" -> Failed to fetch/parse: " . $e->getMessage());
                Log::error("Stock News Aggregation Error [{$company->symbol}]: " . $e->getMessage());
            }

            // Sleep briefly to avoid rate limits
            usleep(500000); // 0.5 seconds
        }

        $this->info("Stock-specific news aggregation complete.");
    }
}
