<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;

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
    protected $description = 'Seed the logo URLs for the top NGX companies';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $companies = Company::all();
        $this->info("Updating logos for " . $companies->count() . " companies...");

        foreach ($companies as $company) {
            // We use UI Avatars for consistent, reliable initial-based logos
            $name = urlencode(substr($company->symbol, 0, 2)); // Use first two letters of symbol
            $logoUrl = "https://ui-avatars.com/api/?name={$name}&background=0F5257&color=fff&size=128&bold=true";
            
            $company->update(['logo_url' => $logoUrl]);
            $this->info("Updated {$company->symbol} -> {$logoUrl}");
        }
        
        // Also clear the cache since we modified company data
        \Illuminate\Support\Facades\Artisan::call('cache:clear');

        $this->info("Done! Logos have been seeded and cache cleared.");
    }
}
