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
            $url = 'https://ngxpulse.ng/api/ngxdata/stocks';
            
            $response = Http::withHeaders([
                'accept' => 'application/json',
                'Referer' => 'https://ngxpulse.ng/',
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            ])->timeout(30)->get($url);

            if (!$response->successful()) {
                throw new \Exception("NGX Pulse Endpoint returned status code: " . $response->status());
            }

            $data = $response->json();
            $stocksList = $data['stocks'] ?? null;

            if (!is_array($stocksList) || empty($stocksList)) {
                throw new \Exception("NGX Pulse Endpoint returned empty or invalid JSON array.");
            }

            // Structure check
            $firstItem = $stocksList[0] ?? null;
            if (!$firstItem || !isset($firstItem['symbol']) || !array_key_exists('current_price', $firstItem) || !array_key_exists('volume', $firstItem)) {
                throw new \Exception("NGX JSON Structure has changed! The required keys (symbol, current_price, volume) were not found.");
            }

            $updatesCount = 0;
            $missingSymbols = [];
            $today = now()->format('Y-m-d');

            // Fetch the HTML to extract the exact logoMapping object
            $htmlResponse = Http::withHeaders([
                'Referer' => 'https://ngxpulse.ng/',
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            ])->timeout(30)->get('https://ngxpulse.ng/');

            $logoMapping = [];
            if ($htmlResponse->successful()) {
                if (preg_match('/let logoMapping=(\{.*?\});/', $htmlResponse->body(), $matches)) {
                    $logoMapping = json_decode($matches[1], true) ?? [];
                }
            }

            DB::beginTransaction();

            foreach ($stocksList as $stock) {
                $symbol = strtoupper(trim($stock['symbol'] ?? ''));
                $closePrice = $stock['current_price'];
                $prevPrice = $stock['previous_close'] ?? $closePrice;
                $change = $closePrice - $prevPrice;
                $changePct = $stock['change_percent'] ?? 0;
                
                $logoUrl = null;
                if (isset($logoMapping[$symbol])) {
                    $logoUrl = "https://ngxpulse.ng/logos_small/" . $logoMapping[$symbol];
                }
                
                $marketCap = $stock['market_cap'] ?? null;

                if (empty($symbol) || $closePrice === null) continue;

                $company = Company::where('symbol', $symbol)->first();

                if (!$company) {
                    // Create the company if it's missing using NGX data
                    $company = Company::create([
                        'symbol' => $symbol,
                        'name' => trim($stock['name'] ?? $symbol),
                        'sector' => isset($stock['sector']) ? ucwords(strtolower($stock['sector'])) : 'Unknown',
                        'business_type' => 'Unknown',
                        'description' => 'A publicly listed company on the Nigerian Exchange (NGX).',
                        'latest_price' => $closePrice,
                        'price_change' => $change,
                        'price_change_pct' => $changePct,
                        'logo_url' => $logoUrl,
                        'market_cap' => $marketCap,
                    ]);
                    $missingSymbols[] = $symbol; // still keep track to log what was added
                } else {
                    // Update denormalized fields
                    $company->update([
                        'latest_price' => $closePrice,
                        'price_change' => $change,
                        'price_change_pct' => $changePct,
                        'logo_url' => $logoUrl,
                        'market_cap' => $marketCap,
                    ]);
                }

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
