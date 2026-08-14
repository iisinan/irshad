<?php

namespace App\Console\Commands;

use App\Models\Company;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;

class SeedNgxLogosCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ngx:logos';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed the logo URLs for the top NGX companies from NGXPulse';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $companies = Company::all();
        $this->info('Fetching logo mapping from NGXPulse...');

        try {
            $response = Http::withHeaders([
                'Referer' => 'https://ngxpulse.ng/',
            ])->timeout(20)->get('https://ngxpulse.ng/stocks/DANGCEM');

            $html = $response->body();
            $logoMapping = [];
            
            if (preg_match('/let logoMapping=(\{.*?\});/', $html, $matches)) {
                $logoMapping = json_decode($matches[1], true) ?? [];
                $this->info('Successfully extracted logo mapping for ' . count($logoMapping) . ' companies.');
            } else {
                $this->warn('Could not find logoMapping in NGXPulse HTML. Falling back entirely to UI Avatars.');
            }

            $this->info('Updating logos for ' . $companies->count() . ' companies...');
            $updatedNgx = 0;
            $updatedFallback = 0;

            foreach ($companies as $company) {
                if (isset($logoMapping[$company->symbol])) {
                    $filename = $logoMapping[$company->symbol];
                    $logoUrl = "https://ngxpulse.ng/logos_small/{$filename}";
                    $company->update(['logo_url' => $logoUrl]);
                    $this->info("Updated {$company->symbol} -> {$logoUrl}");
                    $updatedNgx++;
                } else {
                    // Fallback to UI Avatars for consistent, reliable initial-based logos
                    $name = urlencode(substr($company->symbol, 0, 2)); // Use first two letters of symbol
                    $logoUrl = "https://ui-avatars.com/api/?name={$name}&background=0F5257&color=fff&size=128&bold=true";
                    $company->update(['logo_url' => $logoUrl]);
                    $this->line("Fallback {$company->symbol} -> UI Avatars");
                    $updatedFallback++;
                }
            }

            // Also clear the cache since we modified company data
            Artisan::call('cache:clear');

            $this->info("Done! Seeded {$updatedNgx} logos from NGXPulse and {$updatedFallback} fallbacks.");
        } catch (\Exception $e) {
            $this->error('Failed to fetch from NGXPulse: ' . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
