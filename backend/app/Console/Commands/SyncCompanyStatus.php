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

            $financial = DB::table('financials')->where('company_id', $company->id)->orderBy('created_at', 'desc')->first();
            $totalAssets  = !empty($chosen['total_assets']['value']) ? floatval($chosen['total_assets']['value']) : floatval($financial->total_assets ?? 0);
            $marketCap    = floatval($calc['denominator_value'] ?? $company->market_cap ?? 0);
            $totalDebt    = !empty($chosen['total_debt']['value']) ? floatval($chosen['total_debt']['value']) : floatval($financial->total_debt ?? 0);
            $cash         = !empty($chosen['cash_and_equivalents']['value']) ? floatval($chosen['cash_and_equivalents']['value']) : floatval($financial->cash_and_equivalents ?? 0);
            $totalRevenue = !empty($chosen['total_revenue']['value']) ? floatval($chosen['total_revenue']['value']) : floatval($financial->total_revenue ?? 0);
            $interestIncome = !empty($chosen['interest_income']['value']) ? floatval($chosen['interest_income']['value']) : (!empty($chosen['non_permissible_income']['value']) ? floatval($chosen['non_permissible_income']['value']) : floatval($financial->interest_income ?? 0));

            // Impure ratio (recalculate if 0 or missing to ensure accurate decision)
            $impureRatio = !empty($ratios['non_permissible_income_ratio']) ? $ratios['non_permissible_income_ratio'] * 100 : null;
            if ($impureRatio === null && $totalRevenue > 0) {
                $impureRatio = ($interestIncome / $totalRevenue) * 100;
            }

            // Debt ratio
            $debtRatio = !empty($ratios['interest_bearing_debt_ratio']) ? $ratios['interest_bearing_debt_ratio'] * 100 : null;
            if ($debtRatio === null && $marketCap > 0) {
                $debtRatio = ($totalDebt / $marketCap) * 100;
            }

            // Cash ratio
            $cashRatio = !empty($ratios['cash_and_equivalents_ratio']) ? $ratios['cash_and_equivalents_ratio'] * 100 : null;
            if ($cashRatio === null && $marketCap > 0) {
                $cashRatio = ($cash / $marketCap) * 100;
            }

            // --- Stage 1: Business Activity ---
            // Use cached result if available (same 7-day key as StockController).
            // Do NOT call Perplexity if not cached — quota may be exhausted and it will hang.
            // Instead, treat missing stage1 as PASS (conservative approach).
            $stage1 = Cache::get("aaoifi_stage1_{$symbol}");
            if ($stage1 === null) {
                // No cache — run local rule-based screening without calling external Perplexity API
                $perplexity = new \App\Services\PerplexityAiService();
                $stage1 = $perplexity->runBusinessActivityScreening($company, false);
            }

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

            // Clear per-company listing/analysis caches so pages reflect new verdict immediately.
            // NOTE: Do NOT clear aaoifi_stage1_{symbol} here — we need it to stay cached
            // so subsequent syncs don't trigger expensive/failing Perplexity API calls.
            Cache::forget("stocks.show.{$symbol}");
            Cache::forget("stocks.show.{$symbol}_v2");

            $this->info("  {$symbol}: stage1=" . ($stage1Pass ? 'PASS' : 'FAIL') . " stage2=" . ($stage2Pass ? 'PASS' : 'FAIL') . " -> {$finalStatus}" . ($isVerified ? ' (scholar override)' : ''));
            $updatedCount++;
        }

        // Clear global stock listing caches
        Cache::forget('stocks.index_v6');
        Cache::forget('stocks.index_v5');
        Cache::forget('stocks.index_v4');
        $this->info("Done. Synced {$updatedCount} companies. All caches cleared.");
    }
}
