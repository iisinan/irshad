<?php

namespace App\Console\Commands;

use App\Models\PriceAlert;
use App\Models\Company;
use App\Services\PushNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessPriceAlerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'alerts:process';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process active price alerts and send push notifications to users if conditions are met.';

    /**
     * Execute the console command.
     */
    public function handle(PushNotificationService $pushService)
    {
        $this->info('Starting price alert processing...');

        // Fetch all active alerts with company and user loaded
        $alerts = PriceAlert::with(['company.dailyPrices' => function ($q) {
            $q->latest('date')->limit(1);
        }, 'user'])->where('is_active', true)->get();

        $triggeredCount = 0;

        foreach ($alerts as $alert) {
            $latestPriceRecord = $alert->company->dailyPrices->first();
            
            if (!$latestPriceRecord) {
                continue;
            }

            $currentPrice = (float) $latestPriceRecord->price;
            $targetPrice = (float) $alert->target_price;
            $conditionMet = false;

            if ($alert->condition === 'above' && $currentPrice >= $targetPrice) {
                $conditionMet = true;
            } elseif ($alert->condition === 'below' && $currentPrice <= $targetPrice) {
                $conditionMet = true;
            }

            if ($conditionMet) {
                $symbol = $alert->company->symbol;
                $message = "{$symbol} has reached your target price of ₦{$targetPrice} (Currently: ₦{$currentPrice}).";

                $this->info("Alert triggered for User {$alert->user->id} on {$symbol}: {$message}");

                // Send Push Notification
                if ($alert->user->fcm_token) {
                    try {
                        $pushService->sendToUser(
                            $alert->user,
                            "Price Alert: {$symbol}",
                            $message,
                            ['type' => 'price_alert', 'symbol' => $symbol]
                        );
                    } catch (\Exception $e) {
                        Log::error("Failed to send push notification to user {$alert->user->id}: " . $e->getMessage());
                    }
                }

                // In-app notification
                $alert->user->notifications()->create([
                    'title' => "Price Alert: {$symbol}",
                    'message' => $message,
                    'type' => 'price_alert',
                    'data' => ['symbol' => $symbol, 'price' => $currentPrice],
                    'is_read' => false,
                ]);

                // Mark alert as inactive so it doesn't trigger repeatedly
                $alert->update(['is_active' => false]);
                $triggeredCount++;
            }
        }

        $this->info("Completed processing. Triggered {$triggeredCount} alerts.");
    }
}
