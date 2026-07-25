<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class SyncCompanyStatus extends Command
{
    protected $signature = 'irshad:sync-status';
    protected $description = 'Sync the companies table current_status with the latest AI financial and business screenings';

    public function handle()
    {
        $this->info("Starting global status synchronization...");
        $companies = DB::table('companies')->get();
        $updatedCount = 0;

        foreach ($companies as $company) {
            $symbol = $company->symbol;
            
            // Get latest financial screening
            $fin = DB::table('financial_screenings')
                ->where('company_ticker', $symbol)
                ->orderBy('created_at', 'desc')
                ->first();
                
            // Get latest business screening
            $bus = DB::table('business_screenings')
                ->where('ticker', $symbol)
                ->orderBy('created_at', 'desc')
                ->first();
                
            if (!$fin) {
                // No financial data yet -> Doubtful
                if ($company->current_status !== 'doubtful') {
                    DB::table('companies')->where('id', $company->id)->update(['current_status' => 'doubtful']);
                    $updatedCount++;
                }
                continue;
            }

            // Decode chosen values and calculation results
            $chosen = json_decode($fin->chosen_values ?? '{}', true);
            $calc = json_decode($fin->calculation_results ?? '{}', true);
            $ratios = $calc['ratios'] ?? [];
            
            // 1. Business Status
            $businessStatus = 'insufficient_data';
            if ($bus) {
                if ($bus->business_compliance_status === 'Compliant') {
                    $businessStatus = 'pass';
                } elseif ($bus->business_compliance_status === 'Non-Compliant') {
                    $businessStatus = 'fail';
                } else {
                    $businessStatus = 'warning';
                }
            }

            // 2. Financial Metrics
            $totalAssets = floatval($chosen['total_assets']['value'] ?? 0);
            $marketCap = floatval($calc['denominator_value'] ?? $company->market_cap ?? 0);
            $totalDebt = floatval($chosen['total_debt']['value'] ?? 0);
            $cash = floatval($chosen['cash_and_equivalents']['value'] ?? 0);
            
            $denVal = $marketCap > 0 ? $marketCap : 0; // The frontend defaults to market cap

            // 3. Debt Status
            $debtStatus = 'insufficient_data';
            if ($denVal > 0) {
                $debtRatio = ($totalDebt / $denVal) * 100;
                $debtStatus = $debtRatio <= 30 ? 'pass' : ($debtRatio <= 33 ? 'warning' : 'fail');
            }

            // 4. Cash Status
            $cashStatus = 'insufficient_data';
            if ($denVal > 0) {
                $cashRatio = ($cash / $denVal) * 100;
                $cashStatus = $cashRatio <= 30 ? 'pass' : ($cashRatio <= 33 ? 'warning' : 'fail');
            }
            
            // 5. Impermissible Income
            $impRatio = $ratios['non_permissible_income_ratio'] ?? null;
            $impIncomeStatus = 'insufficient_data';
            if ($impRatio !== null) {
                $impIncomeStatus = floatval($impRatio) <= 5 ? 'pass' : 'fail';
            }

            // 6. Illiquid / Receivables (Default pass since python doesn't explicitly compute them yet, unless frontend sets it)
            // The frontend pulls these from report.illiquid_status which defaults to 'pass' in StockController@aaoifiScreening
            $illiquidStatus = 'pass';
            $receivablesStatus = 'pass';

            // 7. Calculate Final Status (Mirroring AaoifiScreening.jsx)
            $finalStatus = 'halal';
            
            if ($businessStatus === 'fail' || $debtStatus === 'fail' || $cashStatus === 'fail' || $impIncomeStatus === 'fail' || $illiquidStatus === 'fail' || $receivablesStatus === 'fail') {
                $finalStatus = 'non-halal';
            } elseif ($businessStatus === 'warning' || $debtStatus === 'warning' || $cashStatus === 'warning') {
                $finalStatus = 'doubtful';
            } elseif ($businessStatus === 'insufficient_data' || $debtStatus === 'insufficient_data' || $cashStatus === 'insufficient_data' || $impIncomeStatus === 'insufficient_data' || $illiquidStatus === 'insufficient_data' || $receivablesStatus === 'insufficient_data') {
                $finalStatus = 'doubtful';
            }

            // 8. Update database
            if ($company->current_status !== $finalStatus) {
                DB::table('companies')->where('id', $company->id)->update([
                    'current_status' => $finalStatus
                ]);
            }
            
            // 9. Sync stock_statuses table
            $stockStatus = DB::table('stock_statuses')->where('company_id', $company->id)->first();
            
            if (!$stockStatus || !$stockStatus->verified_by_scholar) {
                $statusReason = ($finalStatus === 'halal') 
                    ? 'Passes both qualitative business and quantitative financial Shariah compliance checks.' 
                    : 'Fails Shariah compliance based on current financial disclosures or business activities.';
                
                DB::table('stock_statuses')->updateOrInsert(
                    ['company_id' => $company->id],
                    [
                        'status' => $finalStatus,
                        'reason' => $statusReason,
                        'last_updated' => now(),
                        'updated_at' => now(),
                    ]
                );
            }

            $this->info("Synced {$symbol} to {$finalStatus}");
            $updatedCount++;
        }
        
        // Clear caches
        Cache::forget('stocks.index_v6');
        $this->info("Synced {$updatedCount} companies successfully. Cache cleared.");
    }
}
