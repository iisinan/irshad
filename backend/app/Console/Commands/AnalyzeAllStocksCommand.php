<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use App\Services\PerplexityAiService;
use Illuminate\Support\Facades\Cache;

class AnalyzeAllStocksCommand extends Command
{
    protected $signature = 'irshad:analyze-all-stocks {--symbol= : Specific stock symbol to analyze} {--force : Force refresh cache}';
    protected $description = 'Fetch and cache Irshad AI Shariah analysis for all stocks using Perplexity search engine.';

    public function handle(PerplexityAiService $aiService)
    {
        $symbol = $this->option('symbol');
        $force = $this->option('force');

        $query = Company::with(['status', 'financials' => fn($q) => $q->latest()]);
        if ($symbol) {
            $query->where('symbol', strtoupper($symbol));
        }

        $companies = $query->orderBy('symbol')->get();
        $total = $companies->count();

        $this->info("Starting Irshad AI Shariah analysis for {$total} companies...");

        foreach ($companies as $index => $company) {
            $num = $index + 1;
            $this->info("[{$num}/{$total}] Analyzing {$company->symbol} ({$company->name})...");

            $cacheKey = "stock.perplexity.v1.{$company->symbol}";
            if ($force) {
                Cache::forget($cacheKey);
            }

            try {
                $statusStr = $company->status ? $company->status->status : 'unknown';
                $financials = $company->financials->first();

                $result = $aiService->analyzeCompliance($company, $financials, $statusStr);
                $score = $result['confidence_score'] ?? null;
                $sourcesCount = count($result['sources'] ?? []);
                $this->info(" -> Success! Confidence: " . ($score ?? 'N/A') . "%, Sources: {$sourcesCount}");

                if ($score !== null) {
                    \Illuminate\Support\Facades\DB::table('stock_statuses')
                        ->updateOrInsert(
                            ['company_id' => $company->id],
                            ['confidence_score' => $score, 'updated_at' => now()]
                        );
                }
            } catch (\Exception $e) {
                $this->error(" -> Failed for {$company->symbol}: " . $e->getMessage());
            }

            // Sleep briefly to respect Perplexity API rate limits and avoid throttling
            if ($num < $total) {
                sleep(2);
            }
        }

        $this->info("Completed Irshad AI Shariah analysis for all stocks.");
    }
}
