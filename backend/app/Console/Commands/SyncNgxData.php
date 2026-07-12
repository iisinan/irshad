<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\DailyPrice;
use App\Services\NgxService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class SyncNgxData extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'ngx:sync';

    /**
     * The console command description.
     */
    protected $description = 'Atomically sync stock prices from Yahoo Finance for all companies';

    /**
     * Execute the console command.
     */
    public function handle(NgxService $ngxService)
    {
        $this->info('Starting ATOMIC NGX data sync...');
        $companies = Company::all();
        
        $allData = [];

        try {
            $this->info('Fetching data from API...');
            
            // Step 1: Fetch all data in-memory. If it crashes, it throws an exception here.
            foreach ($companies as $company) {
                $allData[] = [
                    'company' => $company,
                    'data' => $ngxService->fetchAtomicData($company)
                ];
                // Sleep briefly to avoid aggressive rate limiting
                usleep(100000); // 100ms delay
            }
            $this->info('Successfully fetched all data. Preparing atomic update...');
            
            // Step 2: Atomic Database Transaction
            DB::beginTransaction();
            
            foreach ($allData as $item) {
                $company = $item['company'];
                $data = $item['data'];
                
                if ($data['price'] > 0) {
                    DailyPrice::updateOrCreate(
                        [
                            'company_id' => $company->id,
                            'date' => now()->toDateString(),
                        ],
                        [
                            'price' => $data['price'],
                            'volume' => 0,
                        ]
                    );
                    
                    if (isset($data['prev_price']) && $data['prev_price'] > 0) {
                        DailyPrice::updateOrCreate(
                            [
                                'company_id' => $company->id,
                                'date' => now()->subDay()->toDateString(),
                            ],
                            [
                                'price' => $data['prev_price'],
                                'volume' => 0,
                            ]
                        );
                    }
                }

                // Update financials if available from Yahoo Finance
                if (isset($data['total_assets']) && $data['total_assets'] > 0) {
                    \App\Models\Financial::updateOrCreate(
                        ['company_id' => $company->id],
                        [
                            'total_assets' => $data['total_assets'] ?? 0,
                            'total_debt' => $data['total_debt'] ?? 0,
                            'total_revenue' => $data['total_revenue'] ?? 0,
                            'interest_income' => $data['interest_income'] ?? 0,
                            'market_cap' => $data['market_cap'] ?? 0,
                        ]
                    );
                }
            }
            
            DB::commit();
            $this->info('Database committed successfully.');

            // Step 3: Clear all caches so they regenerate using DB on next request
            Cache::flush();
            $this->info('Redis cache flushed. NGX Sync complete.');
            
        } catch (Exception $e) {
            DB::rollBack();
            $this->error('Sync failed or API crashed: ' . $e->getMessage());
            Log::error('Atomic NGX Sync Failed: ' . $e->getMessage());
            // We DO NOT update the cache or DB. It gracefully fails and keeps yesterday's data.
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
