<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class FetchLogosCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ngx:fetch-logos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch stock logos using Yahoo Finance and Clearbit API';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $companies = Company::all();
        $this->info("Found {$companies->count()} companies. Fetching logos...");

        // Ensure directory exists
        if (!Storage::disk('public')->exists('logos')) {
            Storage::disk('public')->makeDirectory('logos');
        }

        $bar = $this->output->createProgressBar($companies->count());

        foreach ($companies as $company) {
            $symbol = trim($company->symbol);
            $yahooSymbol = str_contains($symbol, '.') ? $symbol : "{$symbol}.LG";

            // If we already have a logo downloaded, we can skip it.
            // But let's check if the file actually exists
            $logoPath = "logos/{$symbol}.png";

            if (Storage::disk('public')->exists($logoPath) && $company->logo_url) {
                $bar->advance();
                continue;
            }

            // Fetch website from Yahoo Finance
            $domain = null;
            try {
                $response = Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                ])->timeout(5)->get("https://query2.finance.yahoo.com/v10/finance/quoteSummary/{$yahooSymbol}", [
                    'modules' => 'assetProfile'
                ]);

                if ($response->successful()) {
                    $website = $response->json('quoteSummary.result.0.assetProfile.website');
                    if ($website) {
                        // Extract domain
                        $parsedUrl = parse_url($website);
                        $domain = $parsedUrl['host'] ?? null;
                        
                        // Remove www.
                        if ($domain && str_starts_with($domain, 'www.')) {
                            $domain = substr($domain, 4);
                        }
                    }
                }
            } catch (\Exception $e) {
                // Ignore API timeouts
            }

            if ($domain) {
                try {
                    // Fetch logo from Clearbit
                    $logoResponse = Http::timeout(5)->get("https://logo.clearbit.com/{$domain}");
                    
                    if ($logoResponse->successful() && $logoResponse->header('Content-Type') !== 'application/json') {
                        Storage::disk('public')->put($logoPath, $logoResponse->body());
                        $company->logo_url = '/storage/' . $logoPath;
                        $company->save();
                    }
                } catch (\Exception $e) {
                    // Ignore
                }
            }
            
            // Sleep to avoid rate limiting
            usleep(200000); // 200ms
            
            $bar->advance();
        }

        $bar->finish();
        $this->info("\nLogos fetched successfully!");
    }
}
