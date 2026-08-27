<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\NewsArticle;
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

        $companies = Company::all();
        $added = 0;

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

            if (NewsArticle::where('source_url', $url)->exists()) {
                // If it already exists, maybe we can update its category just in case it was misclassified before
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

            $cleanDesc = strip_tags(html_entity_decode($desc, ENT_QUOTES | ENT_HTML5));
            $cleanDesc = preg_replace('/\s+/', ' ', $cleanDesc);
            $cleanDesc = trim($cleanDesc);

            $companyId = null;
            foreach ($companies as $comp) {
                $symbolWord = '\b' . preg_quote(strtolower($comp->symbol), '/') . '\b';
                $nameSnippet = preg_quote(strtolower(explode(' ', $comp->name)[0]), '/'); 
                
                if (preg_match("/$symbolWord/", $text) || (strlen($nameSnippet) > 3 && strpos($text, $nameSnippet) !== false)) {
                    $companyId = $comp->id;
                    break;
                }
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

        $this->info("Saved $added new articles.");
    }
}
