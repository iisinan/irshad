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

            if (!$fin) {
                // No financial data yet -> mark doubtful only if not scholar-verified
                $stockStatus = DB::table('stock_statuses')->where('company_id', $company->id)->first();
                if (!$stockStatus || !$stockStatus->verified_by_scholar) {
                    DB::table('companies')->where('id', $company->id)->update(['current_status' => 'doubtful']);
                    DB::table('stock_statuses')->updateOrInsert(
                        ['company_id' => $company->id],
                        [
                            'status'       => 'doubtful',
                            'reason'       => 'Insufficient financial data to assess Shariah compliance.',
                            'last_updated' => now(),
                            'updated_at'   => now(),
                        ]
                    );
                    $this->info("  {$symbol}: no financial data -> doubtful");
                    $updatedCount++;
                }
                continue;
            }

            // Decode chosen values and calculation results  (mirrors StockController logic exactly)
            $chosen = json_decode($fin->chosen_values ?? '{}', true);
            $calc   = json_decode($fin->calculation_results ?? '{}', true);
            $ratios = $calc['ratios'] ?? [];

            $totalAssets  = floatval($chosen['total_assets']['value'] ?? 0);
            $marketCap    = floatval($calc['denominator_value'] ?? $company->market_cap ?? 0);
            $totalDebt    = floatval($chosen['total_debt']['value'] ?? 0);
            $cash         = floatval($chosen['cash_and_equivalents']['value'] ?? 0);
            $totalRevenue = floatval($chosen['total_revenue']['value'] ?? 0);
            $interestIncome = floatval($chosen['interest_income']['value'] ?? $chosen['non_permissible_income']['value'] ?? 0);

            // Impure ratio (same preference order as StockController)
            $impureRatio = isset($ratios['non_permissible_income_ratio']) ? $ratios['non_permissible_income_ratio'] * 100 : null;
            if ($impureRatio === null && $totalRevenue > 0) {
                $impureRatio = ($interestIncome / $totalRevenue) * 100;
            } elseif ($impureRatio !== null) {
                // already multiplied above
            }

            // Debt ratio
            $debtRatio = isset($ratios['interest_bearing_debt_ratio']) ? $ratios['interest_bearing_debt_ratio'] * 100 : null;
            if ($debtRatio === null && $marketCap > 0) {
                $debtRatio = ($totalDebt / $marketCap) * 100;
            }

            // Cash ratio
            $cashRatio = isset($ratios['cash_and_equivalents_ratio']) ? $ratios['cash_and_equivalents_ratio'] * 100 : null;
            if ($cashRatio === null && $marketCap > 0) {
                $cashRatio = ($cash / $marketCap) * 100;
            }

            // --- Stage 1: Business Activity ---
            // Use the SAME Perplexity cache key as StockController (7-day cache)
            $stage1 = cache()->remember("aaoifi_stage1_{$symbol}", now()->addDays(7), function () use ($company) {
                $perplexity = new \App\Services\PerplexityAiService();
                return $perplexity->runBusinessActivityScreening($company);
            });

            // compliance_status is PASS or FAIL (from Perplexity cache)
            $stage1Pass = ($stage1['compliance_status'] ?? 'PASS') === 'PASS';

            // --- Stage 2: Financial Ratios ---
            // If ratio data is missing, assume pass (same as StockController line 394-396)
            $debtPass   = $debtRatio   !== null ? ($debtRatio   <= 30) : true;
            $cashPass   = $cashRatio   !== null ? ($cashRatio   <= 30) : true;
            $impurePass = $impureRatio !== null ? ($impureRatio <= 5)  : true;

            $stage2Pass = $debtPass && $cashPass && $impurePass;

            // --- Final Status ---
            // Scholar-verified override takes precedence (same as StockController line 402-403)
            $stockStatus     = DB::table('stock_statuses')->where('company_id', $company->id)->first();
            $isVerified      = $stockStatus && $stockStatus->verified_by_scholar;
            $calculatedStatus = ($stage1Pass && $stage2Pass) ? 'halal' : 'non-halal';
            $finalStatus     = $isVerified ? $stockStatus->status : $calculatedStatus;

            $statusReason = $isVerified
                ? $stockStatus->reason
                : ($finalStatus === 'halal'
                    ? 'Passes both qualitative business and quantitative financial Shariah compliance checks.'
                    : 'Fails Shariah compliance based on current financial disclosures or business activities.');

            // Update companies table
            if ($company->current_status !== $finalStatus) {
                DB::table('companies')->where('id', $company->id)->update(['current_status' => $finalStatus]);
            }

            // Sync stock_statuses table (only if not scholar-verified)
            if (!$isVerified) {
                DB::table('stock_statuses')->updateOrInsert(
                    ['company_id' => $company->id],
                    [
                        'status'       => $finalStatus,
                        'reason'       => $statusReason,
                        'last_updated' => now(),
                        'updated_at'   => now(),
                    ]
                );
            }

            $this->info("  {$symbol}: stage1=" . ($stage1Pass ? 'PASS' : 'FAIL') . " stage2=" . ($stage2Pass ? 'PASS' : 'FAIL') . " -> {$finalStatus}" . ($isVerified ? ' (scholar override)' : ''));
            $updatedCount++;
        }

        // Clear all stock-related caches
        Cache::forget('stocks.index_v6');
        $this->info("Done. Synced {$updatedCount} companies. Cache cleared.");
    }
}
