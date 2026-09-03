<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\NewsArticle;
use App\Models\BusinessActivityUpdate;
use App\Models\Company;
use Carbon\Carbon;

class ScrapeMarketNews extends Command
{
    protected $signature = 'scrape:market-news';
    protected $description = 'Fetch and sanitize live market news from NGXPulse API';

    public function handle()
    {
        $this->info("Fetching market news from NGXPulse API...");

        $response = Http::withHeaders([
            'Referer' => 'https://ngxpulse.ng/blog',
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ])->get('https://ngxpulse.ng/api/news');

        if (!$response->successful()) {
            $this->error("Failed to fetch news. Status: " . $response->status());
            return;
        }

        $data = $response->json();
        $articles = $data['news'] ?? [];

        if (empty($articles)) {
            $this->warn("No news articles returned from API.");
            return;
        }

        $financialKeywords = [
            'bank', 'finance', 'stock', 'market', 'share', 'invest',
            'ngx', 'nigerian exchange', 'dividend', 'bonus', 'shareholder',
            'cbn', 'naira', 'inflation', 'economy', 'gdp', 'budget',
            'oil', 'gas', 'energy', 'mining', 'petroleum',
            'quarter', 'annual', 'revenue', 'profit', 'loss', 'earnings',
            'ipo', 'listing', 'capital', 'fund', 'funding',
            'business', 'company', 'corporate', 'mnc', 'firm', 'trading',
            'price', 'rally', 'crash', 'bull', 'bear', 'index',
            'commodity', 'crude', 'petrol', 'power', 'electricity',
            'sector', 'manufacturing', 'agriculture', 'telecom', 'mobile',
            'asco', 'buyer', 'seller', 'transaction', 'deal', 'merger',
            'acquisition', 'foreign exchange', 'foreign investment', 'forex', 'bond', 'treasury',
            'growth', 'development', 'expansion', 'investment', 'capital market',
            'securities', 'asset', 'portfolio', 'mutual fund', 'pension',
            'consumer', 'retail', 'wholesale', 'trade', 'export', 'import',
            'interest rate', 'monetary', 'fiscal', 'tax', 'duty', 'tariff',
            'lagos', 'customs', 'port', 'free zone', ' refinery', 'plant',
            'ceo', 'chairman', 'board', 'agm', 'bonus share', 'right issue'
        ];

        $nonFinancialKeywords = [
            'football', 'soccer', 'transfer window', 'match preview', 'premier league',
            'music', 'movie', 'film', 'celebrity gossip', 'entertainment news',
            'afcon', 'sports news', 'sport', 'player transfer', 'coach appointment',
            'weather forecast', 'obituary', 'crime news', 'murder', 'kidnap',
            'scandal', 'sex', 'viral', 'trending',
            'football match', 'soccer match', 'league match',
            'election', 'governor', 'senate', 'politician', 'candidate',
            'party', 'opposition', 'ruling'
        ];

        $dividendKeywords = ['dividend', 'payout', 'yield', 'bonus share'];
        $analysisKeywords = ['earnings', 'profit', 'loss', 'revenue', 'quarter', 'q1', 'q2', 'q3', 'q4', 'annual report', 'financial statement', 'screening', 'aaoifi'];

        $businessActivityTypes = [
            'acquisition' => ['acquisition', 'buyout', 'takeover', 'merger'],
            'new_business' => ['new business', 'subsidiary', 'expansion', 'partnership'],
            'disposal' => ['disposal', 'sell-off', 'divestment', 'shut down'],
            'regulatory' => ['regulatory', 'sec', 'cbn penalty', 'fine', 'sanction', 'court'],
        ];

        $companies = Company::all();
        $added = 0;
        $addedBusiness = 0;

        foreach ($articles as $item) {
            $title = $item['title'] ?? '';
            $desc = $item['description'] ?? '';
            $text = strtolower($title . ' ' . $desc);

            $isNonFinancial = false;
            foreach ($nonFinancialKeywords as $kw) {
                if (preg_match('/\b' . preg_quote($kw, '/') . '\b/', $text)) {
                    $isNonFinancial = true;
                    break;
                }
            }
            if ($isNonFinancial) continue;

            $isFinancial = false;
            foreach ($financialKeywords as $kw) {
                if (preg_match('/\b' . preg_quote($kw, '/') . '\b/', $text)) {
                    $isFinancial = true;
                    break;
                }
            }
            if (!$isFinancial) continue;

            $url = $item['link'] ?? '';
            if (empty($url)) continue;

            $cleanDesc = strip_tags(html_entity_decode($desc, ENT_QUOTES | ENT_HTML5));
            $cleanDesc = preg_replace('/\s+/', ' ', $cleanDesc);
            $cleanDesc = trim($cleanDesc);

            $companyId = null;

            // Noise words that are too generic to be a reliable match on their own
            $skipWords = ['nigerian', 'nigeria', 'national', 'group', 'plc', 'limited', 'ltd',
                          'company', 'co', 'industries', 'holdings', 'international', 'africa',
                          'west', 'east', 'first', 'united', 'global', 'new', 'trans'];

            foreach ($companies as $comp) {
                // 1. Ticker symbol must appear as a whole word (e.g. "MTN" ≠ "MTN seeks")
                //    Symbols shorter than 3 chars are too risky — skip symbol matching for them.
                $symbol = strtolower($comp->symbol);
                $symbolPattern = '\\b' . preg_quote($symbol, '/') . '\\b';
                if (strlen($symbol) >= 3 && preg_match("/$symbolPattern/", $text)) {
                    $companyId = $comp->id;
                    break;
                }

                // 2. Name matching: require at least 2 meaningful words (≥4 chars, not in skip list)
                //    from the company name to appear as whole words in the article text.
                $nameParts = array_filter(
                    explode(' ', strtolower($comp->name)),
                    fn($w) => strlen($w) >= 4 && !in_array($w, $skipWords)
                );

                if (count($nameParts) >= 2) {
                    $matched = 0;
                    foreach ($nameParts as $part) {
                        $partPattern = '\\b' . preg_quote($part, '/') . '\\b';
                        if (preg_match("/$partPattern/", $text)) {
                            $matched++;
                        }
                    }
                    if ($matched >= 2) {
                        $companyId = $comp->id;
                        break;
                    }
                } elseif (count($nameParts) === 1) {
                    // Single meaningful word — only match if the word is long enough (≥6 chars)
                    $word = reset($nameParts);
                    if (strlen($word) >= 6) {
                        $partPattern = '\\b' . preg_quote($word, '/') . '\\b';
                        if (preg_match("/$partPattern/", $text)) {
                            $companyId = $comp->id;
                            break;
                        }
                    }
                }
            }

            // Check for Business Activity
            if ($companyId) {
                $bType = null;
                foreach ($businessActivityTypes as $type => $keywords) {
                    foreach ($keywords as $kw) {
                        if (preg_match('/\b' . preg_quote($kw, '/') . '\b/', $text)) {
                            $bType = $type;
                            break 2;
                        }
                    }
                }

                if ($bType) {
                    $exists = BusinessActivityUpdate::where('source_url', $url)->exists();
                    if (!$exists) {
                        BusinessActivityUpdate::create([
                            'company_id' => $companyId,
                            'activity_type' => $bType,
                            'summary' => $title,
                            'source' => $item['source'] ?? 'News',
                            'source_url' => $url,
                            'confidence_level' => 'high',
                            'confidence_score' => 0.9,
                            'date_detected' => isset($item['published_at']) ? Carbon::parse($item['published_at']) : now(),
                        ]);
                        $addedBusiness++;
                    }
                }
            }

            if (NewsArticle::where('source_url', $url)->exists()) {
                // Retroactively update category if needed
                $existing = NewsArticle::where('source_url', $url)->first();
                $cat = 'market_intelligence';
                
                foreach ($dividendKeywords as $kw) {
                    if (preg_match('/\b' . preg_quote($kw, '/') . '\b/', $text)) {
                        $cat = 'dividend';
                        break;
                    }
                }
                
                if ($cat === 'market_intelligence') {
                    foreach ($analysisKeywords as $kw) {
                        if (preg_match('/\b' . preg_quote($kw, '/') . '\b/', $text)) {
                            $cat = 'earnings';
                            break;
                        }
                    }
                }
                
                if ($existing->category !== $cat) {
                    $existing->update(['category' => $cat]);
                }
                continue; 
            }

            $category = 'market_intelligence';
            
            foreach ($dividendKeywords as $kw) {
                if (preg_match('/\b' . preg_quote($kw, '/') . '\b/', $text)) {
                    $category = 'dividend';
                    break;
                }
            }
            
            if ($category === 'market_intelligence') {
                foreach ($analysisKeywords as $kw) {
                    if (preg_match('/\b' . preg_quote($kw, '/') . '\b/', $text)) {
                        $category = 'earnings'; // which gets grouped under analysis
                        break;
                    }
                }
            }

            NewsArticle::create([
                'title' => $title,
                'source_url' => $url,
                'source' => $item['source'] ?? 'News',
                'image_url' => $item['image'] ?? null,
                'content' => mb_strimwidth($cleanDesc, 0, 1000, '...'),
                'category' => $category,
                'published_at' => isset($item['published_at']) ? Carbon::parse($item['published_at']) : now(),
                'company_id' => $companyId
            ]);
            
            $added++;
        }

        // Clear cache so Updates API returns fresh data
        \Illuminate\Support\Facades\Cache::forget('updates_news_insights');

        $this->info("Saved $added new articles. Added $addedBusiness business activities.");
    }
}
