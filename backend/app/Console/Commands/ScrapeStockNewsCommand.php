<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\News;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
        $this->info('Starting stock-specific news aggregation...');

        $companies = Company::all();
        $this->info("Found {$companies->count()} companies to process.");

        foreach ($companies as $company) {
            $this->info("Fetching news for {$company->symbol} ({$company->name})...");

            // Create a focused search query prioritizing exact matches in the title
            $query = urlencode("intitle:\"{$company->name}\" OR intitle:\"{$company->symbol}\"");
            $url = "https://news.google.com/rss/search?q={$query}&hl=en-NG&gl=NG&ceid=NG:en";

            try {
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
                curl_setopt($ch, CURLOPT_TIMEOUT, 10);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
                curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);

                $responseBody = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $curlError = curl_error($ch);

                if ($responseBody !== false && $httpCode >= 200 && $httpCode < 300) {
                    $xml = simplexml_load_string($responseBody, 'SimpleXMLElement', LIBXML_NOCDATA | LIBXML_NONET);

                    if ($xml && isset($xml->channel->item)) {
                        $count = 0;
                        foreach ($xml->channel->item as $item) {
                            $title = (string) $item->title;
                            $link = (string) $item->link;
                            $pubDate = (string) $item->pubDate;

                            // Google News puts the source at the end of the title or in <source> tag
                            $sourceName = isset($item->source) ? (string) $item->source : 'Google News';

                            // Clean up title (remove the " - Source" suffix if it exists)
                            $title = preg_replace('/ - '.preg_quote($sourceName, '/').'$/', '', $title);
                            $title = mb_convert_encoding($title, 'UTF-8', 'UTF-8');

                            $description = strip_tags((string) $item->description);
                            $excerpt = substr($description, 0, 200).(strlen($description) > 200 ? '...' : '');
                            $excerpt = mb_convert_encoding($excerpt, 'UTF-8', 'UTF-8');

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
                    $errorMsg = $responseBody === false ? $curlError : "HTTP Code: $httpCode";
                    $this->error(" -> HTTP request failed. $errorMsg");
                }
            } catch (\Exception $e) {
                $this->error(' -> Failed to fetch/parse: '.$e->getMessage());
                Log::error("Stock News Aggregation Error [{$company->symbol}]: ".$e->getMessage());
            }

            // Sleep briefly to avoid rate limits
            usleep(500000); // 0.5 seconds
        }

        $this->info('Stock-specific news aggregation complete.');
    }
}
