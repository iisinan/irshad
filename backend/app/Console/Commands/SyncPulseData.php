<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Company;
use App\Models\MarketData;
use App\Models\Financial;

class SyncPulseData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pulse:sync-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync financial and market data from NGXPulse for all stocks';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting NGXPulse data sync...');

        $companies = Company::all();
        $count = $companies->count();
        $this->info("Found {$count} companies to process.");

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        foreach ($companies as $company) {
            try {
                $url = "https://ngxpulse.ng/stocks/" . $company->symbol;
                $response = Http::timeout(30)->get($url);

                if ($response->successful()) {
                    $html = $response->body();

                    // Parse SSR_FUNDAMENTALS
                    preg_match('/window\.__SSR_FUNDAMENTALS__\s*=\s*(.*?);<\/script>/', $html, $fundMatches);
                    $fundamentals = null;
                    if (isset($fundMatches[1])) {
                        $fundamentals = json_decode($fundMatches[1], true);
                    }

                    // Parse SSR_STOCK
                    preg_match('/window\.__SSR_STOCK__\s*=\s*(.*?);<\/script>/', $html, $stockMatches);
                    $stockData = null;
                    if (isset($stockMatches[1])) {
                        $stockData = json_decode($stockMatches[1], true);
                    }

                    if ($fundamentals) {
                        $financial = $company->financials()->latest()->first();
                        
                        // If no financial record exists, we could create one, but for now we only update the latest.
                        if ($financial) {
                            $financial->eps = $fundamentals['eps'] ?? null;
                            $financial->pe_ratio = $fundamentals['pe_ratio'] ?? null;
                            $financial->dividend_yield = $fundamentals['dividend_yield'] ?? null;
                            $financial->roe = $fundamentals['roe'] ?? null;
                            $financial->profit_margin = $fundamentals['profit_margin'] ?? null;

                            if ($financial->total_revenue && $financial->profit_margin) {
                                $financial->net_income = $financial->total_revenue * ($financial->profit_margin / 100);
                            }

                            $financial->save();
                        }
                    }

                    if ($stockData) {
                        MarketData::updateOrCreate(
                            [
                                'company_id' => $company->id,
                                'ticker' => $company->symbol,
                                'last_trading_date' => isset($stockData['trade_date']) ? substr($stockData['trade_date'], 0, 10) : now()->toDateString()
                            ],
                            [
                                'latest_price' => $stockData['current_price'] ?? null,
                                'daily_change' => $stockData['change'] ?? null, // Assuming change is absolute
                                'percentage_change' => $stockData['change_percent'] ?? null,
                                'market_capitalisation' => $stockData['market_cap'] ?? null,
                                'volume' => $stockData['volume'] ?? null,
                                'shares_outstanding' => $stockData['shares_outstanding'] ?? null,
                                'fifty_two_week_high' => $stockData['high_52w'] ?? null,
                                'fifty_two_week_low' => $stockData['low_52w'] ?? null,
                                'open_price' => $stockData['open_price'] ?? null,
                                'previous_close' => $stockData['previous_close'] ?? null,
                                'day_high' => $stockData['high_price'] ?? null,
                                'day_low' => $stockData['low_price'] ?? null,
                                'data_source' => 'NGXPulse',
                                'retrieval_timestamp' => now()
                            ]
                        );
                    }
                }
            } catch (\Exception $e) {
                Log::error("Failed to sync pulse data for {$company->symbol}: " . $e->getMessage());
                $this->error("\nFailed for {$company->symbol}: " . $e->getMessage());
            }

            $bar->advance();
            sleep(1); // Rate limiting
        }

        $bar->finish();
        $this->newLine();
        $this->info('NGXPulse data sync completed.');
    }
}
