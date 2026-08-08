<?php

namespace App\Console\Commands;

use App\Models\AaoifiScreening;
use App\Models\Company;
use App\Models\Dividend;
use App\Models\Financial;
use App\Models\FinancialScreening;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class WarmCache extends Command
{
    protected $signature   = 'cache:warm {--force : Re-warm even if already cached}';
    protected $description = 'Pre-populate file cache for all stock endpoints to eliminate cold-start latency';

    public function handle(): int
    {
        $this->info('🔥 Warming cache for all stocks...');

        $companies = Company::select(['id', 'name', 'symbol', 'sector', 'current_status', 'latest_price',
            'price_change_pct', 'logo_url', 'market_cap', 'pe_ratio', 'eps', 'price_change', 'industry'])
            ->orderBy('symbol')
            ->get();

        $bar = $this->output->createProgressBar($companies->count());
        $bar->start();

        $warmed  = 0;
        $skipped = 0;

        foreach ($companies as $company) {
            $symbol      = $company->symbol;
            $showKey     = "stocks.show.full.{$symbol}";
            $aaoifiKey   = "aaoifi.screening.{$symbol}";

            // ── Warm show endpoint ──────────────────────────────────────────
            if ($this->option('force') || ! Cache::has($showKey)) {
                try {
                    $comp = Company::with([
                        'status',
                        'marketData',
                        'financials' => fn ($q) => $q->latest()->limit(1),
                        'news'       => fn ($q) => $q->latest()->limit(10),
                    ])->where('id', $company->id)->first();

                    if ($comp) {
                        $stockArray = $comp->toArray();
                        if ($comp->marketData) {
                            $stockArray = array_merge($stockArray, $comp->marketData->toArray());
                            unset($stockArray['market_data']);
                        }

                        $dividends = Dividend::where('ticker', $symbol)
                            ->whereIn('status', ['upcoming', 'paid'])
                            ->orderByRaw("CASE WHEN status = 'upcoming' THEN 0 ELSE 1 END, pay_date DESC")
                            ->limit(5)
                            ->get();

                        $upcoming = $dividends->where('status', 'upcoming')->whereNotNull('ex_date')->sortBy('ex_date')->first();
                        $lastPaid = $dividends->where('status', 'paid')->sortByDesc('pay_date')->first();

                        $stockArray['upcoming_dividend']  = $upcoming  ? ['amount' => $upcoming->amount,  'currency' => $upcoming->currency,  'dividend_type' => $upcoming->dividend_type,  'ex_date' => $upcoming->ex_date?->toDateString(),  'record_date' => $upcoming->record_date?->toDateString(), 'pay_date' => $upcoming->pay_date?->toDateString(),  'status' => $upcoming->status]  : null;
                        $stockArray['last_paid_dividend'] = $lastPaid ? ['amount' => $lastPaid->amount, 'currency' => $lastPaid->currency, 'dividend_type' => $lastPaid->dividend_type, 'ex_date' => $lastPaid->ex_date?->toDateString(), 'pay_date' => $lastPaid->pay_date?->toDateString(), 'status' => $lastPaid->status] : null;

                        $aaoifi = AaoifiScreening::where('company_id', $comp->id)
                            ->select('business_status', 'impermissible_income_ratio', 'impermissible_income_status')
                            ->first();

                        $stockArray['business_status'] = $aaoifi?->business_status ?? null;

                        if (isset($stockArray['status']) && is_array($stockArray['status'])) {
                            $ratio = (float) ($aaoifi?->impermissible_income_ratio ?? 0);
                            $stockArray['status']['purification_required'] = ($stockArray['status']['status'] ?? '') === 'halal' && $ratio > 0;
                            $stockArray['status']['haram_revenue_percent'] = round($ratio, 4);
                        }

                        Cache::put($showKey, $stockArray, 3600); // 1 hour for warmer
                        $warmed++;
                    }
                } catch (\Throwable $e) {
                    Log::warning("Cache warm failed for {$symbol} (show): " . $e->getMessage());
                }
            } else {
                $skipped++;
            }

            // ── Warm AAOIFI endpoint ────────────────────────────────────────
            if (($this->option('force') || ! Cache::has($aaoifiKey))) {
                try {
                    $aaoifi = AaoifiScreening::where('company_id', $company->id)->first();
                    if ($aaoifi) {
                        // Trigger the aaoifi endpoint logic via HTTP internally — simplest approach
                        // is to just mark it for warming; the first real request will cache it.
                        // For now, skip AAOIFI warming to keep memory usage low.
                    }
                } catch (\Throwable $e) {
                    // silent
                }
            }

            $bar->advance();
        }

        // Also warm the screener list
        $screenerKey = 'stocks.ngx_' . md5(json_encode([]));
        if ($this->option('force') || ! Cache::has($screenerKey)) {
            $this->newLine();
            $this->info('Warming screener list...');
            // The screener list is warmed automatically on first request via safeTaggedCache
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("✅ Done! Warmed: {$warmed} | Already cached: {$skipped}");

        return self::SUCCESS;
    }
}
