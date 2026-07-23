<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Financial;
use App\Models\StockStatus;

class AaoifiComplianceService
{
    /**
     * AAOIFI rules standard limits
     * Total Debt / Total Assets < 30%
     * Interest Income / Total Revenue < 5%
     * (We will use total_assets as an approximation for total revenue if revenue isn't available, 
     * but ideally it's based on revenue. The current financials table has: total_assets, total_debt, interest_income)
     */
    const MAX_DEBT_RATIO = 0.30;
    const MAX_INTEREST_INCOME_RATIO = 0.05;

    /**
     * STAGE 1: RULE 1 (Simply Wall St Industry Check)
     */
    /**
     * STAGE 1: RULE 1 (Simply Wall St Industry Check)
     */
    const BLACKLIST_KEYWORDS = [
        "bank", 
        "financial services",
        "financial",
        "insurance", 
        "capital market",
        "mortgage",
        "microfinance",
        "micro-finance",
        "tobacco", 
        "distillery",
        "distiller",
        "winery",
        "vintner",
        "brewery",
        "breweries",
        "brewer",
        "guinness",
        "gambling",
        "casino",
        "conventional lending",
        "alcohol production",
        "alcohol distribution",
        "liquor",
        "spirits"
    ];

    public function evaluateCompliance(Company $company, Financial $financials, ?string $swsIndustry = null, ?array $aiSectorEval = null)
    {
        // For Rule 1: Use activity detection if available, fallback to robust keyword check
        if ($aiSectorEval && isset($aiSectorEval['has_prohibited_activities'])) {
            if ($aiSectorEval['has_prohibited_activities'] === true) {
                $reason = $aiSectorEval['reason'] ?? "Failed Rule 1: Sector Check. The company's core business activity involves prohibited elements (e.g., alcohol, gambling, conventional finance) according to AAOIFI standards.";
                return $this->saveStatus($company, 'non-halal', "Failed Rule 1 (Activity Verified): " . $reason);
            }
        } else {
            // Robust fallback check
            $sector = strtolower($company->sector ?? '');
            $businessType = strtolower($company->business_type ?? '');
            $name = strtolower($company->name ?? '');
            $symbol = strtolower($company->symbol ?? '');
            $sws = strtolower($swsIndustry ?? '');

            $isBlacklistedSector = false;
            
            foreach (self::BLACKLIST_KEYWORDS as $keyword) {
                if (str_contains($sector, $keyword) || 
                    str_contains($businessType, $keyword) || 
                    str_contains($name, $keyword) || 
                    str_contains($symbol, $keyword) || 
                    str_contains($sws, $keyword)) {
                    $isBlacklistedSector = true;
                    break;
                }
            }

            // JAIZ BANK EXEMPTION AND NARRATIVE
            if (strtoupper($company->symbol) === 'JAIZBANK' || strtoupper($company->symbol) === 'JAIZ') {
                return $this->saveStatus(
                    $company, 
                    'halal', 
                    "Status is Halal. Jaiz Bank is a fully licensed Islamic bank operating strictly under non-interest banking principles."
                );
            }

            if ($isBlacklistedSector) {
                return $this->saveStatus(
                    $company, 
                    'non-halal', 
                    "Failed Rule 1: Business Activity Check. The stock failed due to non-compliant business activities (e.g., alcohol, conventional finance/banking, gambling, tobacco)."
                );
            }
        }

        // Ensure variables are not zero to avoid division by zero
        $marketCap = $financials->market_cap > 0 ? $financials->market_cap : 1;
        $totalRevenue = $financials->total_revenue > 0 ? $financials->total_revenue : 1;

        // Calculate NGX Financial Ratios
        $debtToMarketCap = $financials->total_debt / $marketCap;
        $cashAndSecurities = (float)$financials->cash_and_equivalents + (float)$financials->interest_bearing_securities;
        $cashRatioToMarketCap = $cashAndSecurities / $marketCap;
        $purificationFactor = $financials->interest_income / $totalRevenue;

        // STAGE 2: RULE 2 (NGX Debt Limit Check)
        if ($debtToMarketCap >= self::MAX_DEBT_RATIO) {
            return $this->saveStatus(
                $company, 
                'non-halal', 
                "Failed Rule 2: Debt Limit Check based on recent financial disclosure. Interest-bearing debt-to-market-cap ratio is " . round($debtToMarketCap * 100, 2) . "% (Max permitted threshold is 30.00%)."
            );
        }

        // STAGE 3: RULE 3 (NGX Cash & Securities Limit Check)
        // Using MAX_DEBT_RATIO here because AAOIFI dictates 30% for both.
        if ($cashRatioToMarketCap >= self::MAX_DEBT_RATIO) {
            return $this->saveStatus(
                $company, 
                'non-halal', 
                "Failed Rule 3: Cash & Securities Check based on recent financial disclosure. Liquid cash and interest-bearing securities-to-market-cap ratio is " . round($cashRatioToMarketCap * 100, 2) . "% (Max permitted threshold is 30.00%)."
            );
        }

        // STAGE 4: RULE 4 (NGX Interest Income Limit Check)
        if ($purificationFactor >= self::MAX_INTEREST_INCOME_RATIO) {
            return $this->saveStatus(
                $company, 
                'non-halal', 
                "Failed Rule 4: Interest Income Limit Check based on recent financial disclosure. Passive interest income represents " . round($purificationFactor * 100, 2) . "% of gross revenue (Max permitted threshold is 5.00%)."
            );
        }

        // PIPELINE RESULT PROCESSING (ALL STAGES PASSED)
        if ($purificationFactor > 0) {
            return $this->saveStatus(
                $company, 
                'halal', 
                "Stock passes all screens. Status is Halal with an active dividend purification factor of " . round($purificationFactor * 100, 3) . "%."
            );
        }

        return $this->saveStatus(
            $company, 
            'halal', 
            "Stock passes all screens cleanly. Status is 100% Halal and Shariah-compliant."
        );
    }

    private function saveStatus(Company $company, string $status, string $reasonText)
    {
        $stockStatus = $company->status()->first();
        
        if ($stockStatus && $stockStatus->verified_by_scholar) {
            return $stockStatus;
        }

        $oldStatus = $stockStatus ? $stockStatus->status : null;

        $newStatus = StockStatus::updateOrCreate(
            ['company_id' => $company->id],
            [
                'status' => $status,
                'reason' => $reasonText,
                'verified_by_scholar' => false,
                'last_updated' => now(),
            ]
        );

        $company->update(['current_status' => $status]);

        // Keep aaoifi_screenings table in sync
        $aaoifiScreening = \App\Models\AaoifiScreening::where('company_id', $company->id)->latest()->first();
        if ($aaoifiScreening) {
            $aaoifiScreening->update(['final_status' => $status]);
        }

        if ($oldStatus === 'halal' && $status === 'non-halal') {
            $this->notifyUsersOfDowngrade($company);
        }

        return $newStatus;
    }

    private function notifyUsersOfDowngrade(Company $company)
    {
        // Find users with FCM tokens (in the future, filter by those who favorited the stock)
        $users = \App\Models\User::whereNotNull('fcm_token')->get();

        foreach ($users as $user) {
            \Log::info("Push Notification -> User {$user->id}: Alert! {$company->symbol} is no longer Shariah compliant.");
            
            // Firebase Cloud Messaging HTTP v1 API Skeleton
            if ($user->fcm_token) {
                try {
                    /*
                    // Requires setting up a service account and generating an OAuth2 token
                    // For now, this is a skeleton showing how the structure should look
                    $accessToken = 'YOUR_GOOGLE_OAUTH2_TOKEN';
                    
                    \Illuminate\Support\Facades\Http::withToken($accessToken)->post('https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send', [
                        'message' => [
                            'token' => $user->fcm_token,
                            'notification' => [
                                'title' => 'Shariah Compliance Alert',
                                'body'  => "{$company->symbol} is no longer Shariah compliant.",
                            ],
                            'data' => [
                                'type' => 'stock',
                                'reference_id' => (string) $company->id,
                            ],
                        ],
                    ]);
                    */
                } catch (\Exception $e) {
                    \Log::error("Failed to send FCM: " . $e->getMessage());
                }
            }
        }
    }
}
