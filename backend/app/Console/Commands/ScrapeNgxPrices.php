<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use App\Models\Company;
use App\Mail\ScraperAlert;
use Throwable;

class ScrapeNgxPrices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:scrape-ngx-prices';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scrapes NGX EOD Spot Prices from the NGX DocLib API and updates our databases';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting NGX price scraping...');
        
        $adminEmail = env('ADMIN_EMAIL', 'admin@irshad.com');

        try {
            $url = 'https://doclib.ngxgroup.com/REST/api/statistics/equities/?market=&sector=&orderby=&pageSize=300&pageNo=0';
            
            $response = Http::withHeaders([
                'accept' => 'application/json;odata=verbose',
            ])->timeout(30)->get($url);

            if (!$response->successful()) {
                throw new \Exception("NGX Endpoint returned status code: " . $response->status());
            }

            $data = $response->json();

            if (!is_array($data) || empty($data)) {
                throw new \Exception("NGX Endpoint returned empty or invalid JSON array.");
            }

            // Structure check
            $firstItem = $data[0] ?? null;
            if (!$firstItem || !isset($firstItem['Symbol']) || !array_key_exists('ClosePrice', $firstItem) || !array_key_exists('Volume', $firstItem)) {
                throw new \Exception("NGX JSON Structure has changed! The required keys (Symbol, ClosePrice, Volume) were not found.");
            }

            $updatesCount = 0;
            $missingSymbols = [];
            $today = now()->format('Y-m-d');

            DB::beginTransaction();

            foreach ($data as $stock) {
                $symbol = strtoupper(trim($stock['Symbol'] ?? ''));
                $closePrice = $stock['ClosePrice'];
                $change = $stock['Change'];
                $changePct = $stock['CalculateChangePercent'];

                if (empty($symbol) || $closePrice === null) continue;

                $company = Company::where('symbol', $symbol)->first();

                if ($company) {
                    // Update denormalized fields
                    $company->update([
                        'latest_price' => $closePrice,
                        'price_change' => $change,
                        'price_change_pct' => $changePct,
                    ]);

                    // Update or create daily price
                    DB::table('daily_prices')->updateOrInsert(
                        ['company_id' => $company->id, 'date' => $today],
                        [
                            'price' => $closePrice,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );

                    $updatesCount++;
                } else {
                    $missingSymbols[] = $symbol;
                }
            }

            DB::commit();

            $details = "Successfully updated prices for {$updatesCount} companies.\n";
            if (count($missingSymbols) > 0) {
                $details .= "The following symbols from NGX are missing in our DB: " . implode(', ', $missingSymbols);
            }

            $this->info($details);

            // Fire Success Email
            Mail::to($adminEmail)->send(new ScraperAlert('success', $details));

        } catch (Throwable $e) {
            DB::rollBack();
            $this->error("Scraper Failed: " . $e->getMessage());
            
            // Fire Error Email
            $errorDetails = "Scraper Exception: \n" . $e->getMessage() . "\n\nFile: " . $e->getFile() . " on line " . $e->getLine();
            Mail::to($adminEmail)->send(new ScraperAlert('error', $errorDetails));

            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
