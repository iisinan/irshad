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
    protected $signature = 'ngx:fetch-profiles {--force : Force fetch even if data exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch stock logos and company overviews using Yahoo Finance and Clearbit API';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $companies = Company::all();
        $this->info("Found {$companies->count()} companies. Fetching profiles (logos and overviews)...");

        // Ensure directory exists
        if (!Storage::disk('public')->exists('logos')) {
            Storage::disk('public')->makeDirectory('logos');
        }

        $bar = $this->output->createProgressBar($companies->count());
        $force = $this->option('force');

        foreach ($companies as $company) {
            $symbol = trim($company->symbol);
            $yahooSymbol = str_contains($symbol, '.') ? $symbol : "{$symbol}.LG";

            $logoPath = "logos/{$symbol}.png";
            $hasLogo = Storage::disk('public')->exists($logoPath) && $company->logo_url;
            $hasOverview = !empty($company->overview);

            // Skip if we already have both and not forcing
            if (!$force && $hasLogo && $hasOverview) {
                $bar->advance();
                continue;
            }

            // Fetch data from Yahoo Finance
            $domain = null;
            $overview = null;
            try {
                $response = Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                ])->timeout(5)->get("https://query2.finance.yahoo.com/v10/finance/quoteSummary/{$yahooSymbol}", [
                    'modules' => 'assetProfile'
                ]);

                if ($response->successful()) {
                    $website = $response->json('quoteSummary.result.0.assetProfile.website');
                    $overview = $response->json('quoteSummary.result.0.assetProfile.longBusinessSummary');
                    
                    if ($website) {
                        $parsedUrl = parse_url($website);
                        $domain = $parsedUrl['host'] ?? null;
                        if ($domain && str_starts_with($domain, 'www.')) {
                            $domain = substr($domain, 4);
                        }
                    }
                }
            } catch (\Exception $e) {
                // Ignore API timeouts
            }

            $updated = false;

            // Save Overview
            if ($overview && (!$hasOverview || $force)) {
                $company->overview = $overview;
                $updated = true;
            }

            // Fetch and Save Logo URL directly
            if ($domain) {
                $clearbitUrl = "https://logo.clearbit.com/{$domain}";
                if ($company->logo_url !== $clearbitUrl) {
                    $company->logo_url = $clearbitUrl;
                    $updated = true;
                }
            }
            
            if ($updated) {
                $company->save();
            }
            
            usleep(200000); // 200ms
            $bar->advance();
        }

        $bar->finish();
        $this->info("\nProfiles fetched successfully!");
    }
}
