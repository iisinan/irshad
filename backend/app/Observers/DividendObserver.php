<?php

namespace App\Observers;

use App\Models\Dividend;
use App\Models\Holding;
use App\Notifications\NewDividendAlert;
use Illuminate\Support\Facades\Log;

class DividendObserver
{
    /**
     * Handle the Dividend "created" event.
     */
    public function created(Dividend $dividend): void
    {
        // Don't send "New Dividend Announced" alerts for past historical dividends that were already paid
        if ($dividend->pay_date) {
            try {
                $payDate = \Carbon\Carbon::parse($dividend->pay_date)->startOfDay();
                if ($payDate->isBefore(now()->startOfDay())) {
                    return; // Historical dividend, do not alert as "new"
                }
            } catch (\Throwable $e) {}
        }

        // Find all users who currently hold this stock
        $holdings = Holding::with('user')->where('symbol', $dividend->ticker)->get();

        foreach ($holdings as $holding) {
            if ($holding->user) {
                // Ensure the user's tier has the dividend_alerts feature
                if (\App\Services\SubscriptionService::canUseFeature($holding->user, 'dividend_alerts')) {
                    try {
                        $holding->user->notify(new NewDividendAlert($dividend));
                    } catch (\Exception $e) {
                        Log::error("Failed to notify user {$holding->user->id} for new dividend of {$dividend->ticker}: " . $e->getMessage());
                    }
                }
            }
        }
    }
}
