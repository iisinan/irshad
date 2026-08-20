<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Watchlist;
use App\Models\UserNotification;
use App\Services\PushNotificationService;
use App\Mail\ComplianceRiskAlert;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class DetectComplianceRisk extends Command
{
    protected $signature = 'irshad:detect-compliance-risk';
    protected $description = 'Detect if a Halal company is approaching Non-Compliant thresholds and notify users.';

    public function handle(PushNotificationService $pushService)
    {
        $this->info('Checking compliance risks...');

        $companies = Company::with('aaoifiScreenings')->whereHas('stockStatus', function($q) {
            $q->where('status', 'halal');
        })->get();

        foreach ($companies as $company) {
            $screening = $company->aaoifiScreenings->sortByDesc('created_at')->first();
            if (!$screening) continue;

            $riskReasons = [];
            // Debt threshold is 30%
            if ($screening->debt_ratio >= 27 && $screening->debt_ratio < 30) {
                $riskReasons[] = "Debt ratio is at " . number_format($screening->debt_ratio, 2) . "% (Limit: 30%)";
            }
            // Impure Income threshold is 5%
            if ($screening->impure_income_ratio >= 4.5 && $screening->impure_income_ratio < 5) {
                $riskReasons[] = "Impure Income ratio is at " . number_format($screening->impure_income_ratio, 2) . "% (Limit: 5%)";
            }
            // Cash threshold is 30%
            if ($screening->cash_ratio >= 27 && $screening->cash_ratio < 30) {
                $riskReasons[] = "Cash ratio is at " . number_format($screening->cash_ratio, 2) . "% (Limit: 30%)";
            }

            if (count($riskReasons) > 0) {
                // Prevent duplicate notifications in the same month
                $cacheKey = "compliance_risk_notified_{$company->symbol}";
                if (Cache::has($cacheKey)) continue;

                $watchlists = Watchlist::with('user')->where('symbol', $company->symbol)
                    ->where('alert_compliance_risk', true)
                    ->get();

                foreach ($watchlists as $wl) {
                    if (!$wl->user) continue;

                    $message = "{$company->symbol} is approaching non-compliant thresholds: " . implode(', ', $riskReasons);

                    if ($wl->alert_inapp) {
                        UserNotification::notify($wl->user_id, "Compliance Risk Warning", $message, [
                            'icon' => '⚠️',
                            'category' => 'screening',
                            'action_url' => "/market/{$company->symbol}",
                            'action_label' => 'View Ratios'
                        ]);
                    }

                    if ($wl->alert_push && $wl->user->fcm_token) {
                        try {
                            $pushService->sendToUser($wl->user, "Compliance Risk: {$company->symbol}", $message, ['type' => 'compliance_risk']);
                        } catch (\Exception $e) { }
                    }

                    if ($wl->alert_email && $wl->user->email) {
                        try {
                            Mail::to($wl->user->email)->send(new ComplianceRiskAlert($wl->user, $company->symbol, $riskReasons));
                        } catch (\Exception $e) {
                            Log::error("Failed to send compliance risk email to {$wl->user->email}: " . $e->getMessage());
                        }
                    }
                }
                
                Cache::put($cacheKey, true, now()->addDays(30));
            }
        }
        $this->info('Done checking compliance risks.');
    }
}
