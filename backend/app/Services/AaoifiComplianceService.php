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
    const BLACKLIST_INDUSTRIES = [
        "Banks", 
        "Insurance", 
        "Diversified Financials", 
        "Consumer Finance", 
        "Capital Markets", 
        "Tobacco", 
        "Distillers and Vintners"
    ];

    public function evaluateCompliance(Company $company, Financial $financials, ?string $swsIndustry = null)
    {
        // For Rule 1: Use provided SWS Industry, fallback to company's sector from DB
        $industry = $swsIndustry ?? $company->sector;

        $isBlacklistedSector = in_array($industry, self::BLACKLIST_INDUSTRIES);

        if ($isBlacklistedSector) {
            return $this->saveStatus(
                $company, 
                'non-halal', 
                "Failed Rule 1: Sector Check. The industry '{$industry}' is explicitly Shariah non-compliant."
            );
        }

        // Ensure variables are not zero to avoid division by zero
        $marketCap = $financials->market_cap > 0 ? $financials->market_cap : 1;
        $totalRevenue = $financials->total_revenue > 0 ? $financials->total_revenue : 1;

        // Calculate NGX Financial Ratios
        $debtToMarketCap = $financials->total_debt / $marketCap;
        $purificationFactor = $financials->interest_income / $totalRevenue;

        // STAGE 2: RULE 2 (NGX Debt Limit Check)
        if ($debtToMarketCap >= self::MAX_DEBT_RATIO) {
            return $this->saveStatus(
                $company, 
                'non-halal', 
                "Failed Rule 2: Debt Limit Check via NGX financial disclosure. Interest-bearing debt-to-market-cap ratio is " . round($debtToMarketCap * 100, 2) . "% (Max permitted threshold is 30.00%)."
            );
        }

        // STAGE 3: RULE 3 (NGX Interest Income Limit Check)
        if ($purificationFactor >= self::MAX_INTEREST_INCOME_RATIO) {
            return $this->saveStatus(
                $company, 
                'non-halal', 
                "Failed Rule 3: Interest Income Limit Check via NGX financial disclosure. Passive interest income represents " . round($purificationFactor * 100, 2) . "% of gross revenue (Max permitted threshold is 5.00%)."
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

        if ($oldStatus === 'halal' && $status === 'non-halal') {
            $this->notifyUsersOfDowngrade($company);
        }

        return $newStatus;
    }

    private function notifyUsersOfDowngrade(Company $company)
    {
        // Find users who favorited this stock and have an FCM token
        $users = \App\Models\User::whereNotNull('fcm_token')
            ->whereHas('favorites', function($q) use ($company) {
                $q->where('item_type', 'stock')->where('item_id', $company->id);
            })->get();

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
