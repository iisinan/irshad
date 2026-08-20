<?php

namespace App\Services;

use App\Mail\ComplianceReviewNotification;
use App\Models\AaoifiScreening;
use App\Models\Company;
use App\Models\ComplianceHistory;
use App\Models\ComplianceReview;
use App\Models\Financial;
use App\Models\StockStatus;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

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
        'bank',
        'financial services',
        'financial',
        'insurance',
        'capital market',
        'mortgage',
        'microfinance',
        'micro-finance',
        'tobacco',
        'distillery',
        'distiller',
        'winery',
        'vintner',
        'brewery',
        'breweries',
        'brewer',
        'guinness',
        'gambling',
        'casino',
        'conventional lending',
        'alcohol production',
        'alcohol distribution',
        'liquor',
        'spirits',
    ];

    public function evaluateCompliance(Company $company, Financial $financials, ?string $swsIndustry = null, ?array $aiSectorEval = null)
    {
        $screening = AaoifiScreening::where('company_id', $company->id)->latest()->first();

        // Check if the business activity screen already failed from the master list (Excel)
        if ($screening && $screening->business_status === 'fail') {
            return $this->saveStatus(
                $company,
                'non-compliant',
                'Failed Rule 1: Business Activity Check. ' . ($screening->business_reasoning ?? 'The stock failed due to non-compliant business activities.')
            );
        }

        if ($screening && $screening->business_status === 'doubtful') {
            return $this->saveStatus(
                $company,
                'doubtful',
                'Doubtful Rule 1: Business Activity Check. ' . ($screening->business_reasoning ?? 'The stock is marked as doubtful and requires scholar review.')
            );
        }

        // Sync with frontend logic: Prefer LIVE market cap from the companies table, fallback to extracted financials market cap
        $liveMarketCap = (string) ($company->market_cap > 0 ? $company->market_cap : 0);
        $finMarketCap = (string) ($financials->market_cap > 0 ? $financials->market_cap : 0);
        $marketCap = bccomp($liveMarketCap, '0', 4) === 1 ? $liveMarketCap : (bccomp($finMarketCap, '0', 4) === 1 ? $finMarketCap : '1');

        $totalAssets = (string) ($financials->total_assets > 0 ? $financials->total_assets : 0);
        // User instruction: "use market cap, dont ever use toal asset again"
        $denominator = $marketCap;

        $totalRevenue = (string) ($financials->total_revenue > 0 ? $financials->total_revenue : 1);

        $totalDebt = (string) ($financials->total_debt ?: '0');
        $cashAndEquiv = (string) ($financials->cash_and_equivalents ?: '0');
        $interestSec = (string) ($financials->interest_bearing_securities ?: '0');
        $interestIncome = (string) ($financials->interest_income ?: '0');

        $debtPct = $this->tripleCheckCalc($totalDebt, $denominator);
        $cashPct = $this->tripleCheckCalc($cashAndEquiv + $interestSec, $denominator);
        $purPct = $this->tripleCheckCalc($interestIncome, $totalRevenue);

        // STAGE 2: RULE 2 (NGX Debt Limit Check)
        if ($debtPct > 30.00) {
            return $this->saveStatus(
                $company,
                'non-compliant',
                'Failed Rule 2: Debt Limit Check based on recent financial disclosure. Interest-bearing debt ratio is '.$debtPct.'% (Max permitted threshold is 30.00%).'
            );
        }

        // STAGE 3: RULE 3 (NGX Cash & Securities Limit Check)
        if ($cashPct > 30.00) {
            return $this->saveStatus(
                $company,
                'non-compliant',
                'Failed Rule 3: Cash & Securities Check based on recent financial disclosure. Liquid cash and interest-bearing securities ratio is '.$cashPct.'% (Max permitted threshold is 30.00%).'
            );
        }

        // STAGE 4: RULE 4 (NGX Impermissible Income Limit Check)
        $reits = ['NESF', 'SKYESHELT', 'UHOMREIT', 'UPDC REIT', 'UPDCREIT'];
        if ($purPct > 5.00) {
            // Check if it's a REIT, they are exempted from the generic interest income check
            if (in_array(strtoupper($company->symbol), $reits)) {
                return $this->saveStatus(
                    $company,
                    'halal',
                    'Stock passes all screens. Status is Halal. (Exempted from Rule 4 as a REIT under AAOIFI FAS 32; requires scholar verification of underlying assets).'
                );
            }

            return $this->saveStatus(
                $company,
                'non-compliant',
                'Failed Rule 4: Impermissible Income Check based on recent financial disclosure. Impermissible income ratio is '.$purPct.'% (Max permitted threshold is 5.00%).'
            );
        }

        $extraNotes = $screening && $screening->business_reasoning ? ' Notes: ' . $screening->business_reasoning : '';

        // PIPELINE RESULT PROCESSING (ALL STAGES PASSED)
        if ($purPct > 0) {
            return $this->saveStatus(
                $company,
                'halal',
                'Stock passes all screens. Status is Halal with an active dividend purification factor of '.$purPct.'%.' . $extraNotes
            );
        }

        return $this->saveStatus(
            $company,
            'halal',
            'Stock passes all screens cleanly. Status is 100% Halal and Shariah-compliant.' . $extraNotes
        );
    }

    private function saveStatus(Company $company, string $status, string $reasonText)
    {
        $stockStatus = $company->status()->first();
        $oldStatus = $stockStatus ? $stockStatus->status : null;

        if ($stockStatus && $stockStatus->verified_by_scholar) {
            if ($oldStatus !== $status) {
                // Status has drifted from the scholar's verification, stage a review to notify them
                $existingReview = ComplianceReview::where('company_id', $company->id)
                    ->where('status', 'pending')
                    ->where('new_status', $status)
                    ->first();

                if (! $existingReview) {
                    $review = ComplianceReview::create([
                        'company_id' => $company->id,
                        'old_status' => $oldStatus,
                        'new_status' => $status,
                        'reason' => 'SCHOLAR REVIEW REQUIRED: '.$reasonText,
                        'status' => 'pending',
                    ]);
                    $this->notifyAdminsOfReview($review);
                }
            }

            return $stockStatus;
        }

        $oldStatus = $stockStatus ? $stockStatus->status : null;

        if ($oldStatus !== $status) {
            // Auto-approve downgrades to non-compliant if it failed Business Activity (Rule 1)
            // But only if it was NOT halal before (e.g. from pending or doubtful). Any change from halal to non-compliant must go to admin review.
            if ($status === 'non-compliant' && str_contains($reasonText, 'Rule 1') && $oldStatus !== 'halal') {
                // Apply immediately
                StockStatus::updateOrCreate(
                    ['company_id' => $company->id],
                    [
                        'status' => $status,
                        'reason' => $reasonText,
                        'verified_by_scholar' => false,
                        'last_updated' => now(),
                    ]
                );
                $company->update(['current_status' => $status]);
                $aaoifiScreening = AaoifiScreening::where('company_id', $company->id)->latest()->first();
                if ($aaoifiScreening) {
                    $aaoifiScreening->update(['final_status' => $status]);
                }
                // Record the history for the automatic change
                ComplianceHistory::create([
                    'company_id' => $company->id,
                    'old_status' => $oldStatus,
                    'new_status' => $status,
                    'reason' => $reasonText.' (Auto-applied)',
                    'changed_at' => now(),
                ]);

                return $company->status()->first();
            }

            // Check if there is already a pending review for this exact change
            $existingReview = ComplianceReview::where('company_id', $company->id)
                ->where('status', 'pending')
                ->where('new_status', $status)
                ->first();

            if (! $existingReview) {
                $review = ComplianceReview::create([
                    'company_id' => $company->id,
                    'old_status' => $oldStatus,
                    'new_status' => $status,
                    'reason' => $reasonText,
                    'status' => 'pending',
                ]);

                $this->notifyAdminsOfReview($review);
            }

            // Return existing status without modifying the database
            return $stockStatus ?? (object) ['status' => 'pending'];
        }

        // If status hasn't changed, just update the timestamp
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

        $aaoifiScreening = AaoifiScreening::where('company_id', $company->id)->latest()->first();
        if ($aaoifiScreening) {
            $aaoifiScreening->update(['final_status' => $status]);
        }

        return $newStatus;
    }

    private function notifyAdminsOfReview($review)
    {
        // Eager-load the company relation so it is available in the queued mailable
        $review->load('company');
        Mail::to('sinanismailaidris@gmail.com')->queue(new ComplianceReviewNotification($review));
    }

    private function notifyUsersOfDowngrade(Company $company)
    {
        // Find users with FCM tokens (in the future, filter by those who favorited the stock)
        $users = User::whereNotNull('fcm_token')->get();

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
                    \Log::error('Failed to send FCM: '.$e->getMessage());
                }
            }
        }
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
        
        // 3. Python script calc (Decimal precision)
        $pythonPath = base_path('scripts/aaoifi_calc.py');
        $pythonOutput = shell_exec("python3 " . escapeshellarg($pythonPath) . " " . escapeshellarg(strval($num)) . " " . escapeshellarg(strval($den)));
        $calc3 = round(floatval(trim($pythonOutput)), 4);
        
        // Compare with slight tolerance for floating point jitter
        if (abs($calc1 - $calc2) > 0.001 || abs($calc2 - $calc3) > 0.001) {
            \Illuminate\Support\Facades\Log::error("AAOIFI Math Mismatch: Float[$calc1] BCMath[$calc2] Python[$calc3] for $num / $den");
            throw new \Exception("Triple check calculation failed for $num / $den. Mismatched results.");
        }
        
        return $calc2;
    }
}
