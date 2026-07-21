<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\DailyPrice;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SeedHistoricalPrices extends Command
{
    protected $signature = 'ngx:seed-history {days=30 : Number of days to seed}';
    protected $description = 'Seed realistic synthetic historical daily prices for companies with live prices';

    public function handle()
    {
        $days = (int) $this->argument('days');
        $this->info("Seeding $days days of historical prices...");

        $companies = Company::whereNotNull('latest_price')->where('latest_price', '>', 0)->get();
        $this->info("Found {$companies->count()} companies with a live price.");

        if ($companies->isEmpty()) {
            $this->warn("No companies found with latest_price. Aborting.");
            return Command::SUCCESS;
        }

        DB::beginTransaction();

        try {
            $totalCreated = 0;
            $today = Carbon::today();

            // Clear old seeded history if we run this multiple times
            // This prevents duplicate date entries
            DailyPrice::where('date', '<', $today->toDateString())->delete();

            foreach ($companies as $company) {
                // Determine a base volatility for this company (e.g., between 0.5% and 3% daily movement)
                $volatility = rand(5, 30) / 1000; 
                
                // Start with the latest price
                $currentSimulatedPrice = $company->latest_price;

                $history = [];
                
                for ($i = 1; $i <= $days; $i++) {
                    $date = $today->copy()->subDays($i);
                    
                    // Skip weekends (NGX doesn't trade on weekends)
                    if ($date->isWeekend()) {
                        continue;
                    }

                    // Random daily change between -$volatility and +$volatility
                    $dailyChangePct = (rand(-100, 100) / 100) * $volatility;
                    
                    $prevPrice = $currentSimulatedPrice / (1 + $dailyChangePct);
                    
                    // Add some rounding to make it look like real stock prices (2 decimals)
                    $prevPrice = round($prevPrice, 2);

                    $history[] = [
                        'company_id' => $company->id,
                        'date' => $date->toDateString(),
                        'price' => $prevPrice,
                        'volume' => rand(1000, 5000000), // Random volume
                        'change_pct' => round($dailyChangePct * 100, 2), // Percentage representation
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    $currentSimulatedPrice = $prevPrice;
                }

                DailyPrice::insert($history);
                $totalCreated += count($history);
            }

            DB::commit();
            $this->info("Successfully seeded $totalCreated historical price records.");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Failed to seed historical prices: " . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
