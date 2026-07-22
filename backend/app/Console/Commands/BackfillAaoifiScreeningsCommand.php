<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use App\Services\AaoifiScreeningService;

class BackfillAaoifiScreeningsCommand extends Command
{
    protected $signature = 'data:backfill-aaoifi';
    protected $description = 'Generate AAOIFI screenings for all companies missing it.';

    public function handle(AaoifiScreeningService $screeningService)
    {
        $companies = Company::whereDoesntHave('aaoifiScreening')->get();
        $this->info("Found " . $companies->count() . " companies missing AAOIFI screenings.");

        foreach ($companies as $company) {
            $this->info("Screening {$company->symbol}...");
            try {
                $screeningService->screenCompany($company);
                $this->info("Success for {$company->symbol}.");
            } catch (\Exception $e) {
                $this->error("Failed for {$company->symbol}: " . $e->getMessage());
            }
            // Respect rate limits
            sleep(4);
        }

        $this->info("Done backfilling AAOIFI screenings.");
    }
}
