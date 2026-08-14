<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Company;
use App\Models\DailyPrice;
use App\Models\MarketData;
use App\Models\Financial;
use App\Models\Dividend;
use App\Services\NgxService;
use Exception;

class SyncMarketDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-market-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Unified scraper for live prices, dividends, and deep fundamental data.';

    /**
     * Execute the console command.
     */
    public function handle(NgxService $ngxService)
    {
        $this->info('Starting Unified Market Data Sync...');

        $companies = Company::all();
        $totalCompanies = $companies->count();

        if ($totalCompanies === 0) {
            $this->error('No companies found in database.');
            return Command::FAILURE;
        }

        // ==========================================
        // 1. STAGE ONE: FAST LIVE PRICES (DocLib API)
        // ==========================================
        $this->info('STAGE 1: Skipped (NGX API blocks Guzzle. Stage 3 fetches prices).');
        
        // ==========================================
        // 2. STAGE TWO: DIVIDEND CALENDAR
        // ==========================================
        $this->info('STAGE 2: Scraping NGX Pulse Dividend Calendar...');
        try {
            $divResponse = Http::withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36')
                ->withOptions(['verify' => false])
                ->retry(2, 5000)
                ->timeout(15)
                ->get('https://ngxpulse.ng/ngx-dividend-calendar');

            if ($divResponse->successful()) {
                $html = $divResponse->body();
                if (preg_match('/window\.__SSR_DIVIDEND_CALENDAR__\s*=\s*(\{.*?\});/s', $html, $matches)) {
                    $data = json_decode($matches[1], true);
                    
                    if (json_last_error() === JSON_ERROR_NONE && isset($data['rows']) && is_array($data['rows'])) {
                        $divsSaved = 0;
                        foreach ($data['rows'] as $row) {
                            $ticker = trim($row['symbol']);
                            $company = $companies->firstWhere('symbol', $ticker);
                            
                            if (!$company) continue;

                            $amount = round(floatval($row['amount']), 4);
                            $type = trim($row['type'] ?? '');
                            $status = trim(strtolower($row['status'] ?? 'tbd'));

                            Dividend::updateOrCreate(
                                [
                                    'company_id' => $company->id,
                                    'ticker' => $ticker,
                                    'ex_date' => !empty($row['exDate']) ? $row['exDate'] : null,
                                    'dividend_type' => $type,
                                    'amount' => $amount,
                                ],
                                [
                                    'record_date' => !empty($row['recordDate']) ? $row['recordDate'] : null,
                                    'pay_date' => !empty($row['payDate']) ? $row['payDate'] : null,
                                    'status' => $status,
                                    'currency' => trim($row['currency'] ?? 'NGN'),
                                    'yield' => isset($row['yield']) ? floatval($row['yield']) : null,
                                ]
                            );
                            $divsSaved++;
                        }
                        $this->info("✓ Scraped and saved {$divsSaved} dividend records.");
                    } else {
                        $this->warn('Dividend Calendar JSON structure was invalid.');
                    }
                } else {
                    $this->warn('Could not find __SSR_DIVIDEND_CALENDAR__ payload.');
                }
            } else {
                $this->warn('Failed to fetch dividend calendar: HTTP ' . $divResponse->status());
            }
        } catch (Exception $e) {
            $this->error('Dividend scrape error: ' . $e->getMessage());
            Log::error('Dividend scrape error: ' . $e->getMessage());
        }

        // ==========================================
        // 3. STAGE THREE: DEEP FUNDAMENTALS AND VOLUME
        // ==========================================
        $this->info("STAGE 3: Scraping Deep Fundamentals & Volume (This will take a few minutes)...");
        
        $bar = $this->output->createProgressBar($totalCompanies);
        $bar->start();

        foreach ($companies as $company) {
            try {
                $url = "https://ngxpulse.ng/stocks/" . $company->symbol;
                $response = Http::timeout(20)->get($url);

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
                        
                        if ($financial) {
                            $financial->eps = $fundamentals['eps'] ?? $financial->eps;
                            $financial->pe_ratio = $fundamentals['pe_ratio'] ?? $financial->pe_ratio;
                            $financial->dividend_yield = $fundamentals['dividend_yield'] ?? $financial->dividend_yield;
                            $financial->roe = $fundamentals['roe'] ?? $financial->roe;
                            $financial->profit_margin = $fundamentals['profit_margin'] ?? $financial->profit_margin;

                            if ($financial->total_revenue && $financial->profit_margin) {
                                $financial->net_income = $financial->total_revenue * ($financial->profit_margin / 100);
                            }
                            $financial->save();
                        }
                        
                        $company->eps = $fundamentals['eps'] ?? $company->eps;
                        $company->pe_ratio = $fundamentals['pe_ratio'] ?? $company->pe_ratio;
                        $company->div_yield = $fundamentals['dividend_yield'] ?? $company->div_yield;
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
                                'daily_change' => $stockData['change'] ?? null,
                                'percentage_change' => $stockData['change_percent'] ?? null,
                                'market_capitalisation' => $stockData['market_cap'] ?? null,
                                'volume' => $stockData['volume'] ?? null,
                                'shares_outstanding' => $stockData['shares_outstanding'] ?? null,
                                'fifty_two_week_high' => $stockData['high_52w'] ?? null,
                                'fifty_two_week_low' => $stockData['low_52w'] ?? null,
                                'open_price' => $stockData['open_price'] ?? null,
                                'previous_close' => $stockData['previous_close'] ?? null,
                            ]
                        );
                        
                        // Just in case the official doclib api missed the volume, update the volume for today
                        $todayStr = now()->toDateString();
                        if (isset($stockData['volume']) && $stockData['volume'] > 0) {
                            DailyPrice::where('company_id', $company->id)
                                ->where('date', $todayStr)
                                ->update(['volume' => $stockData['volume']]);
                        }
                        
                        // Update the company table directly for the API/frontend
                        $company->latest_price = $stockData['current_price'] ?? $company->latest_price;
                        $company->price_change = $stockData['change'] ?? $company->price_change;
                        $company->price_change_pct = $stockData['change_percent'] ?? $company->price_change_pct;
                        $company->market_cap = $stockData['market_cap'] ?? $company->market_cap;
                        $company->shares_outstanding = $stockData['shares_outstanding'] ?? $company->shares_outstanding;
                        $company->{'52w_high'} = $stockData['high_52w'] ?? $company->{'52w_high'};
                        $company->{'52w_low'} = $stockData['low_52w'] ?? $company->{'52w_low'};
                    }
                    
                    $company->save();
                }
            } catch (Exception $e) {
                // Silently continue to next company on timeout or error so the whole job doesn't crash
                Log::warning("Unified Scraper: Failed to fetch deep data for {$company->symbol}: " . $e->getMessage());
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        
        $this->info('✓ Unified Market Data Sync Complete!');
        return Command::SUCCESS;
    }
}
