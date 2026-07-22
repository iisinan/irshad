<?php

namespace App\Services;

use App\Models\AaoifiScreening;
use App\Models\Company;
use App\Models\News;
use App\Models\CorporateDisclosure;
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
        
        // Fetch mock/local news for context
        $news = News::where('title', 'like', "%{$company->name}%")
            ->orWhere('title', 'like', "%{$company->symbol}%")
            ->latest()
            ->take(5)
            ->get()
            ->toArray();
            
        $disclosures = CorporateDisclosure::where('company_symbol', $company->symbol)
            ->latest()
            ->take(3)
            ->get()
            ->map(fn($d) => ['title' => $d->title])
            ->toArray();
            
        $combinedNews = array_merge($news, $disclosures);

        if (empty($combinedNews)) {
            // Mock a recent news item if the database is empty for this company
            $combinedNews = [
                ['title' => "{$company->name} releases latest quarterly financial results."],
                ['title' => "{$company->name} announces new strategic focus in its core sector."]
            ];
        }

        // 2. Business Activity Screening
        $aiResult = $this->geminiService->analyzeBusinessActivity($company, $combinedNews, $financials);
        
        $businessStatus = 'pass';
        if ($aiResult && !empty($aiResult['prohibited_activities'])) {
            $businessStatus = 'fail';
        }

        // 3. Financial Ratio Screening
        $marketCap = $financials ? (float)$financials->market_cap : 0;
        $totalAssets = $financials ? (float)$financials->total_assets : 0;
        $totalDebt = $financials ? (float)$financials->total_debt : 0;
        
        $cash = $financials ? (float)$financials->cash_and_equivalents : 0;
        $interestBearingSecurities = $financials ? (float)$financials->interest_bearing_securities : 0;
        $accountsReceivable = $financials ? (float)$financials->accounts_receivable : 0;
        $illiquidAssets = $financials ? (float)$financials->illiquid_assets : 0;
        
        $interestIncome = $financials ? (float)$financials->interest_income : 0;
        $totalRevenue = $financials ? (float)$financials->total_revenue : 0;

        $debtRatio = null;
        $debtStatus = 'insufficient_data';
        if ($marketCap > 0) {
            $debtRatio = ($totalDebt / $marketCap) * 100;
            $debtStatus = $debtRatio <= 30 ? 'pass' : ($debtRatio <= 33 ? 'warning' : 'fail');
        }

        $cashRatio = null;
        $cashStatus = 'insufficient_data';
        if ($marketCap > 0) {
            $cashRatio = (($cash + $interestBearingSecurities) / $marketCap) * 100;
            $cashStatus = $cashRatio <= 30 ? 'pass' : ($cashRatio <= 33 ? 'warning' : 'fail');
        }

        $illiquidRatio = null;
        $illiquidStatus = 'insufficient_data';
        if ($totalAssets > 0) {
            // AAOIFI: Illiquid Assets / Total Assets >= 30%
            $illiquidRatio = ($illiquidAssets / $totalAssets) * 100;
            $illiquidStatus = $illiquidRatio >= 30 ? 'pass' : 'fail';
        }

        $impermissibleIncomeRatio = null;
        $impIncomeStatus = 'insufficient_data';
        if ($totalRevenue > 0) {
            $impermissibleIncomeRatio = ($interestIncome / $totalRevenue) * 100;
            $impIncomeStatus = $impermissibleIncomeRatio <= 5 ? 'pass' : 'fail';
        }

        // 4. Final Verdict Engine
        $finalStatus = 'compliant';
        
        if ($businessStatus === 'fail' || $debtStatus === 'fail' || $cashStatus === 'fail' || $impIncomeStatus === 'fail' || $illiquidStatus === 'fail') {
            $finalStatus = 'non-compliant';
        } elseif ($businessStatus === 'warning' || $debtStatus === 'warning' || $cashStatus === 'warning') {
            $finalStatus = 'doubtful';
        } elseif ($debtStatus === 'insufficient_data' || $cashStatus === 'insufficient_data' || $illiquidStatus === 'insufficient_data') {
            $finalStatus = 'doubtful';
        }

        // 5. Save to DB
        $screening = AaoifiScreening::create([
            'company_id' => $company->id,
            'business_status' => $businessStatus,
            'business_reasoning' => $aiResult,
            'debt_ratio' => $debtRatio,
            'debt_status' => $debtStatus,
            'cash_ratio' => $cashRatio,
            'cash_status' => $cashStatus,
            'impermissible_income_ratio' => $impermissibleIncomeRatio,
            'impermissible_income_status' => $impIncomeStatus,
            'illiquid_ratio' => $illiquidRatio,
            'illiquid_status' => $illiquidStatus,
            'final_status' => $finalStatus,
            'news_sources' => $combinedNews,
            'financial_data_used' => [
                'market_cap' => $marketCap,
                'total_assets' => $totalAssets,
                'total_debt' => $totalDebt,
                'cash' => $cash,
                'interest_bearing_securities' => $interestBearingSecurities,
                'accounts_receivable' => $accountsReceivable,
                'illiquid_assets' => $illiquidAssets,
                'interest_income' => $interestIncome,
                'total_revenue' => $totalRevenue,
            ],
        ]);

        return $screening;
    }
}
