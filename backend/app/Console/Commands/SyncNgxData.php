<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\DailyPrice;
use App\Services\AaoifiComplianceService;
use App\Services\FinancialUpdateService;
use App\Services\NgxService;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SyncNgxData extends Command
{
    protected $signature = 'ngx:sync {--batch=20 : Companies per fundamentals batch} {--logos : Also fetch logos} {--prices-only : Only sync prices, skip fundamentals} {--fundamentals-only : Only sync fundamentals, skip prices}';

    protected $description = 'Sync NGX live prices (official API) + fundamentals (Yahoo) for all companies';

    public function handle(NgxService $ngxService, AaoifiComplianceService $complianceService)
    {
        $batchSize = (int) $this->option('batch');
        $fetchLogos = $this->option('logos');
        $pricesOnly = $this->option('prices-only');

        $livePrices = [];
        if (! $this->option('fundamentals-only')) {
            $this->info('Fetching all live prices from NGX official API...');

            $livePrices = $ngxService->fetchAllLivePrices();
            $this->info('Got '.count($livePrices).' live prices from NGX API.');

            if (empty($livePrices)) {
                $this->error('NGX price fetch returned empty. Aborting sync.');

                return Command::FAILURE;
            }
        }

        if (! $this->option('fundamentals-only')) {
            // ── STEP 2: Save prices for all companies in one transaction ───────────
            $this->info('Saving prices to database...');
            try {
                DB::reconnect();
                DB::beginTransaction();

                $today = now()->toDateString();
                $yesterday = now()->subDay()->toDateString();
                $pricesSaved = 0;

                foreach (Company::all() as $company) {
                    $symbol = trim($company->symbol);
                    $priceData = $livePrices[$symbol] ?? null;

                    if (! $priceData || $priceData['price'] <= 0) {
                        continue;
                    }

                    $currentPrice = $priceData['price'];

                    // Get yesterday's price from DB to compute prev_price
                    $prevRecord = DailyPrice::where('company_id', $company->id)
                        ->where('date', '<', $today)
                        ->latest('date')
                        ->first();

                    DailyPrice::updateOrCreate(
                        ['company_id' => $company->id, 'date' => $today],
                        ['price' => $currentPrice, 'volume' => 0, 'change_pct' => $priceData['change_pct']]
                    );

                    $change = $currentPrice - ($prevRecord ? $prevRecord->price : $currentPrice);
                    $changePct = $priceData['change_pct'];

                    $company->update([
                        'latest_price' => $currentPrice,
                        'price_change' => $change,
                        'price_change_pct' => $changePct,
                    ]);

                    $pricesSaved++;
                }

                DB::commit();
                $this->info("✓ Saved prices for {$pricesSaved} companies.");
            } catch (Exception $e) {
                DB::rollBack();
                $this->error('Price save failed: '.$e->getMessage());
                Log::error('NGX price save failed: '.$e->getMessage());

                return Command::FAILURE;
            }
        }

        if ($this->option('prices-only')) {
            Cache::flush();
            $this->info('Prices-only sync complete. Cache flushed.');

            return Command::SUCCESS;
        }

        // ── STEP 3: Fetch fundamentals per company in small batches ───────────
        $this->info('');
        $this->info('Fetching fundamentals from Yahoo Finance in batches...');

        $companies = Company::all();
        $batches = $companies->chunk($batchSize);
        $synced = 0;
        $errors = 0;

        foreach ($batches as $batchIndex => $batch) {
            $batchNum = $batchIndex + 1;
            $this->info("--- Fundamentals Batch {$batchNum} / ".$batches->count().' ---');

            $fetched = [];
            foreach ($batch as $company) {
                try {
                    $fundamentals = $ngxService->fetchFundamentals($company);
                    $fetched[] = ['company' => $company, 'data' => $fundamentals];

                    // Only log if we got something useful
                    $gotData = ! empty($fundamentals['sector']) || ! empty($fundamentals['eps']) || $fundamentals['market_cap'] > 0;
                    $this->line($gotData
                        ? "  ✓ {$company->symbol} — sector={$fundamentals['sector']}, PE={$fundamentals['pe_ratio']}"
                        : "  — {$company->symbol} (no Yahoo data)"
                    );
                } catch (Exception $e) {
                    $this->warn("  ✗ {$company->symbol}: ".$e->getMessage());
                    $errors++;
                }
                sleep(3); // 3 seconds between requests to avoid rate limits
            }

            // Commit this batch
            try {
                DB::reconnect();
                DB::beginTransaction();

                foreach ($fetched as $item) {
                    $company = $item['company'];
                    $data = $item['data'];
                    $priceData = $livePrices[trim($company->symbol)] ?? null;

                    // Update company profile
                    $companyUpdate = [];
                    if (! empty($data['sector']) && ($company->sector === 'Unknown' || empty($company->sector))) {
                        $companyUpdate['sector'] = $data['sector'];
                    }
                    if (! empty($data['industry'])) {
                        $companyUpdate['industry'] = $data['industry'];
                    }
                    if (! empty($data['overview'])) {
                        $companyUpdate['overview'] = $data['overview'];
                    }
                    if (! empty($data['analysts_target']) && $data['analysts_target'] > 0) {
                        $companyUpdate['analysts_target'] = $data['analysts_target'];
                    }
                    if (isset($data['dividend_yield']) && $data['dividend_yield'] !== null) {
                        $companyUpdate['div_yield'] = round($data['dividend_yield'] * 100, 4);
                    }

                    $marketCap = $data['market_cap'] ?? 0;
                    $companyUpdate['market_cap'] = $marketCap;
                    $companyUpdate['eps'] = $data['eps'] ?? null;
                    $companyUpdate['pe_ratio'] = $data['pe_ratio'] ?? null;

                    if (! empty($companyUpdate)) {
                        $company->update($companyUpdate);
                    }

                    // Calculate market cap from NGX price × shares outstanding if Yahoo doesn't have it
                    $marketCap = $data['market_cap'] ?? 0;

                    // Save financials if we have any real data
                    $hasFinancials = ($data['total_assets'] > 0)
                        || ($marketCap > 0)
                        || ($data['total_revenue'] > 0)
                        || ! empty($data['eps'])
                        || ! empty($data['pe_ratio']);

                    if ($hasFinancials) {
                        $newData = [
                            'total_assets' => $data['total_assets'] ?? 0,
                            'total_debt' => $data['total_debt'] ?? 0,
                            'total_revenue' => $data['total_revenue'] ?? 0,
                            'interest_income' => $data['interest_income'] ?? 0,
                            'market_cap' => $marketCap,
                            'eps' => $data['eps'] ?? null,
                            'pe_ratio' => $data['pe_ratio'] ?? null,
                            'roe' => $data['roe'] ?? null,
                            'dividend_yield' => $data['dividend_yield'] ?? null,
                            'profit_margin' => $data['profit_margin'] ?? null,
                        ];

                        $financialUpdateService = app(FinancialUpdateService::class);
                        $financialUpdateService->proposeUpdate(
                            $company,
                            $newData,
                            'Automated NGX / Yahoo Finance sync'
                        );
                    } else {
                        $existing = $company->financials()->latest()->first();
                        if ($existing) {
                            $complianceService->evaluateCompliance($company, $existing, $company->sector);
                        }
                    }

                    $synced++;
                }

                DB::commit();
                $this->info("  ✓ Batch {$batchNum} committed ({$synced} total).");

                if ($fetchLogos) {
                    $this->fetchLogosForBatch($batch);
                }

            } catch (Exception $e) {
                DB::rollBack();
                $this->error("  ✗ Batch {$batchNum} FAILED: ".$e->getMessage());
                Log::error("Fundamentals batch {$batchNum} failed: ".$e->getMessage());
                $errors++;
            }

            sleep(2);
        }

        // ── STEP 4: Flush cache ───────────────────────────────────────────────
        Cache::flush();

        $this->info('');
        $this->info('════════════════════════════════════');
        $this->info('Sync complete!');
        $this->info('  Prices  : '.count($livePrices).' companies');
        $this->info("  Fundamentals: {$synced} processed");
        $this->info("  Errors  : {$errors}");
        $this->info('  Cache   : Flushed');
        $this->info('════════════════════════════════════');

        return Command::SUCCESS;
    }

    /**
     * Previously fetched logos using Yahoo Finance to find the website domain.
     * Removed per user request.
     */
    private function fetchLogosForBatch($companies): void
    {
        // Logos are now primarily fetched via ngxpulse scraper
    }
}
