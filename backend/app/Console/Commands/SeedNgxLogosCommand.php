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
        // Top ~30 Nigerian Stock Exchange companies and their official domains
        $domainMap = [
            'MTNN' => 'mtnonline.com',
            'DANGCEM' => 'dangote.com',
            'AIRTELAFRI' => 'airtel.africa',
            'BUACEMENT' => 'buacement.com',
            'GTCO' => 'gtcoplc.com',
            'ZENITHBANK' => 'zenithbank.com',
            'SEPLAT' => 'seplatenergy.com',
            'STANBIC' => 'stanbicibtc.com',
            'NESTLE' => 'nestle-cwa.com',
            'NB' => 'nbplc.com',
            'FBNH' => 'fbnquest.com',
            'UBA' => 'ubagroup.com',
            'ACCESS' => 'accessbankplc.com',
            'ACCESSCORP' => 'accesscorp.ng',
            'WAPCO' => 'lafarge.com.ng',
            'GUINNESS' => 'guinness-nigeria.com',
            'OKOMUOIL' => 'okomunigeria.com',
            'PRESCO' => 'presco-plc.com',
            'DANGSUGAR' => 'dangotesugar.com.ng',
            'FLOURMILL' => 'fmnplc.com',
            'PZ' => 'pzcussons.com',
            'FIDELITYBK' => 'fidelitybank.ng',
            'FCMB' => 'fcmb.com',
            'STERLINGNG' => 'sterling.ng',
            'OANDO' => 'oandoplc.com',
            'TRANSCORP' => 'transcorpnigeria.com',
            'UCAP' => 'unitedcapitalplcgroup.com',
            'UNILEVER' => 'unilevernigeria.com',
            'CADBURY' => 'cadburynigeria.com',
            'JULI' => 'julipharmacy.com',
            'NIDF' => 'chapelhilldenham.com',
        ];

        $this->info("Updating logos for " . count($domainMap) . " companies...");

        foreach ($domainMap as $symbol => $domain) {
            $company = Company::where('symbol', $symbol)->first();
            
            if ($company) {
                // We use Clearbit's free logo API
                $logoUrl = "https://logo.clearbit.com/{$domain}";
                
                $company->update(['logo_url' => $logoUrl]);
                $this->info("Updated {$symbol} -> {$logoUrl}");
            }
        }
        
        // Also clear the cache since we modified company data
        \Illuminate\Support\Facades\Artisan::call('cache:clear');

        $this->info("Done! Logos have been seeded and cache cleared.");
    }
}
