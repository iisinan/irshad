<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Watchlist;
use App\Models\UserNotification;
use App\Services\PushNotificationService;
use App\Mail\PriceMovementAlert;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class DetectPriceMovements extends Command
{
    protected $signature = 'irshad:detect-price-movements';
    protected $description = 'Detect significant price movements (>5%) and notify users with alert_price_change enabled.';

    public function handle(PushNotificationService $pushService)
    {
        $this->info('Checking price movements...');

        $companies = Company::with(['dailyPrices' => function($q) {
            $q->latest('date')->limit(2);
        }])->get();

        foreach ($companies as $company) {
            if ($company->dailyPrices->count() < 2) continue;

            $today = $company->dailyPrices[0]->price;
            $yesterday = $company->dailyPrices[1]->price;
            if ($yesterday == 0) continue;

            $changePct = (($today - $yesterday) / $yesterday) * 100;

            if (abs($changePct) >= 5.0) {
                $watchlists = Watchlist::with('user')->where('symbol', $company->symbol)
                    ->where('alert_price_change', true)
                    ->get();

                foreach ($watchlists as $wl) {
                    if (!$wl->user) continue;

                    $direction = $changePct > 0 ? 'up' : 'down';
                    $icon = $changePct > 0 ? '📈' : '📉';
                    $message = "{$company->symbol} is {$direction} by " . number_format(abs($changePct), 2) . "% today (₦{$today}).";

                    if ($wl->alert_inapp) {
                        UserNotification::notify($wl->user_id, "Significant Price Movement", $message, [
                            'icon' => $icon,
                            'category' => 'price',
                            'action_url' => "/market/{$company->symbol}",
                            'action_label' => 'View Chart'
                        ]);
                    }

                    if ($wl->alert_push && $wl->user->fcm_token) {
                        try {
                            $pushService->sendToUser($wl->user, "Price Movement: {$company->symbol}", $message, ['type' => 'price_alert']);
                        } catch (\Exception $e) { }
                    }

                    if ($wl->alert_email && $wl->user->email) {
                        try {
                            Mail::to($wl->user->email)->send(new PriceMovementAlert($wl->user, $company->symbol, $direction, abs($changePct), (float) $today));
                        } catch (\Exception $e) {
                            Log::error("Failed to send price movement email to {$wl->user->email}: " . $e->getMessage());
                        }
                    }
                }
            }
        }
        $this->info('Done checking price movements.');
    }
}
