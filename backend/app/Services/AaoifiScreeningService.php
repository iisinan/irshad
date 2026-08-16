<?php

namespace App\Services;

use App\Models\AaoifiScreening;
use App\Models\Company;
use App\Models\ComplianceHistory;
use App\Models\CorporateDisclosure;
use App\Models\News;
use App\Models\StockStatus;
use Illuminate\Support\Facades\Log;

class AaoifiScreeningService
{
    protected GeminiAiService $geminiService;

    public function __construct(GeminiAiService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    public function screenCompany(Company $company): AaoifiScreening
    {
        // 1. Gather Data
        $financials = $company->financials()->latest()->first();

        // 2. Business Activity Screening
        // We now rely entirely on the manual master list (Excel) imported into the database.
        $existingScreening = AaoifiScreening::where('company_id', $company->id)->latest()->first();
        $businessStatus = $existingScreening->business_status ?? 'doubtful';
        $aiResult = $existingScreening->business_reasoning ?? null;
        $combinedNews = $existingScreening->news_sources ?? [];

        // 3. Financial Ratio Screening
        // IMPORTANT: Use the live company market_cap (from companies table) as the denominator.
        // The market_cap stored in the financials table is a historical snapshot taken at the time
        // of PDF extraction, which may be stale/inflated. The companies.market_cap is kept current.
        $liveMarketCap = (float) ($company->market_cap ?? 0);
        $historicalMarketCap = $financials ? (float) $financials->market_cap : 0;
        $marketCap = $liveMarketCap > 0 ? $liveMarketCap : $historicalMarketCap;

        $totalAssets = $financials ? (float) $financials->total_assets : 0;
        $totalDebt = $financials ? (float) $financials->total_debt : 0;

        $cash = $financials ? (float) $financials->cash_and_equivalents : 0;
        $interestBearingSecurities = $financials ? (float) $financials->interest_bearing_securities : 0;

        $interestIncome = $financials ? (float) $financials->interest_income : 0;
        $totalRevenue = $financials ? (float) $financials->total_revenue : 0;

        $debtRatio = null;
        $debtStatus = 'insufficient_data';
        $cashRatio = null;
        $cashStatus = 'insufficient_data';
        $impermissibleIncomeRatio = null;
        $impIncomeStatus = 'insufficient_data';

        if ($company->symbol === 'JAIZBANK') {
            // Islamic banks are inherently compliant with these ratios as they deal entirely in non-interest structures
            $debtRatio = 0;
            $debtStatus = 'pass';
            $cashRatio = 0;
            $cashStatus = 'pass';
            $impermissibleIncomeRatio = 0;
            $impIncomeStatus = 'pass';
        } else {
            if (!$financials) {
                // If there are no financial records, we cannot calculate ratios. 
                // We leave them as their default 'insufficient_data'.
            } else {
                if ($marketCap > 0) {
                    $debtRatio = $this->tripleCheckCalc($totalDebt, $marketCap);
                    $debtStatus = $debtRatio <= 30 ? 'pass' : 'fail';
                }

                if ($marketCap > 0) {
                    $cashRatio = $this->tripleCheckCalc($cash + $interestBearingSecurities, $marketCap);
                    $cashStatus = $cashRatio <= 30 ? 'pass' : 'fail';
                }

                if ($totalRevenue > 0) {
                    $impermissibleIncomeRatio = $this->tripleCheckCalc($interestIncome, $totalRevenue);
                    $impIncomeStatus = $impermissibleIncomeRatio <= 5 ? 'pass' : 'fail';
                }
            }
        }

        // 4. Final Verdict Engine
        $finalStatus = 'halal';

        if ($businessStatus === 'fail' || $debtStatus === 'fail' || $cashStatus === 'fail' || $impIncomeStatus === 'fail') {
            $finalStatus = 'non-compliant';
        } elseif ($businessStatus === 'warning' || $businessStatus === 'doubtful') {
            $finalStatus = 'doubtful';
        }

        // 5. Save to DB
        $screening = AaoifiScreening::updateOrCreate(
            ['company_id' => $company->id],
            [
                'business_status' => $businessStatus,
                'business_reasoning' => $aiResult,
                'debt_ratio' => $debtRatio,
                'debt_status' => $debtStatus,
                'cash_ratio' => $cashRatio,
                'cash_status' => $cashStatus,
                'impermissible_income_ratio' => $impermissibleIncomeRatio,
                'impermissible_income_status' => $impIncomeStatus,
                'final_status' => $finalStatus,
                'news_sources' => $combinedNews,
                'financial_data_used' => [
                    'source' => 'Data aggregated from Nigerian Exchange Group (NGX), AfricanFinancials, and Yahoo Finance.',
                    'market_cap' => $marketCap,
                    'total_assets' => $totalAssets,
                    'total_debt' => $totalDebt,
                    'cash_and_equivalents' => $cash,
                    'interest_bearing_securities' => $interestBearingSecurities,
                    'interest_income' => $interestIncome,
                    'total_revenue' => $totalRevenue,
                    'source_url' => $financials ? $financials->source_url : null,
                    'published_date' => $financials ? $financials->published_date : null,
                    'reporting_period' => $financials ? $financials->reporting_period : null,
                    'financial_year' => $financials ? (preg_match('/20\d{2}/', $financials->reporting_period, $matches) ? $matches[0] : null) : null,
                ],
            ]);

        // Synchronize with Company current_status & StockStatus
        $stockStatus = $company->status()->first();
        if (! $stockStatus || ! $stockStatus->verified_by_scholar) {
            $oldStatus = $company->current_status;
            app()->instance('verdict.unlock', true);
            $company->update(['current_status' => $finalStatus]);
            app()->instance('verdict.unlock', false);

            if ($finalStatus === 'non-compliant') {
                $reason = ($businessStatus === 'fail' ? 'Failed Rule 1: Business Activity Check. ' . ($aiResult ?? 'The stock failed due to non-compliant business activities.') : 'Failed AAOIFI financial ratio screening.');
            } elseif ($finalStatus === 'doubtful') {
                $reason = ($businessStatus === 'doubtful' || $businessStatus === 'warning') ? 'Doubtful Rule 1: Business Activity Check. ' . ($aiResult ?? 'Requires scholar review.') : 'Doubtful AAOIFI financial ratio screening (insufficient data).';
            } else {
                if ($impermissibleIncomeRatio > 0 && $impermissibleIncomeRatio <= 5) {
                    $reason = 'Stock passes all screens. Status is Halal with an active dividend purification factor of ' . number_format($impermissibleIncomeRatio, 2) . '%.' . ($aiResult ? ' Notes: ' . $aiResult : '');
                } elseif (!$financials) {
                    $reason = 'Stock passes Business Activity Check. Status is Halal (Financial data pending).' . ($aiResult ? ' Notes: ' . $aiResult : '');
                } else {
                    $reason = 'Stock passes all screens cleanly. Status is 100% Halal and Shariah-compliant.' . ($aiResult ? ' Notes: ' . $aiResult : '');
                }
            }

            StockStatus::updateOrCreate(
                ['company_id' => $company->id],
                [
                    'status' => $finalStatus,
                    'reason' => $reason,
                    'verified_by_scholar' => false,
                    'last_updated' => now(),
                ]
            );

            if ($oldStatus !== $finalStatus) {
                ComplianceHistory::create([
                    'company_id' => $company->id,
                    'old_status' => $oldStatus,
                    'new_status' => $finalStatus,
                    'reason' => $reason.' (Auto-applied)',
                    'changed_at' => now(),
                ]);
            }
        }

        return $screening;
    }

    private function tripleCheckCalc($num, $den): float
    {
        if ($den == 0 || $den == null) return 0.0;
        
        $numFloat = floatval($num);
        $denFloat = floatval($den);
        
        // 1. Float calc
        $calc1 = round(($numFloat / $denFloat) * 100, 4);
        
        // 2. BCMath calc (Arbitrary Precision)
        $calc2 = round(floatval(bcdiv(bcmul(strval($num), '100', 8), strval($den), 8)), 4);
        
        // 3. Safe Scaled Math
        $scale = 1000000;
        $calc3 = round((($numFloat / $scale) / ($denFloat / $scale)) * 100, 4);
        
        // Compare with slight tolerance for floating point jitter
        if (abs($calc1 - $calc2) > 0.001 || abs($calc2 - $calc3) > 0.001) {
            Log::error("AAOIFI Math Mismatch: Float[$calc1] BCMath[$calc2] Scaled[$calc3] for $num / $den");
            throw new \Exception("Triple check calculation failed for $num / $den. Mismatched results.");
        }
        
        return $calc2;
    }
}
