<?php

namespace App\Console\Commands;

use App\Models\Dividend;
use App\Models\Holding;
use App\Models\UserNotification;
use App\Notifications\DividendPurificationDueNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SendDividendPurificationReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-dividend-purification-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send purification notifications to users when their held stocks pay dividends';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for dividends paying today...');

        $today = Carbon::today();

        // 1. Find dividends where pay_date is today
        $dividends = Dividend::with(['company.aaoifiScreening'])
            ->whereDate('pay_date', $today)
            ->where('amount', '>', 0)
            ->get();

        if ($dividends->isEmpty()) {
            $this->info('No dividends scheduled for payment today.');
            return 0;
        }

        $notifiedCount = 0;

        foreach ($dividends as $dividend) {
            $company = $dividend->company;
            if (!$company) {
                continue;
            }

            // Only notify for compliant stocks with incidental impure revenue
            $status = strtolower($company->current_status ?? $company->aaoifiScreening?->final_status ?? 'doubtful');
            $isHalal = $status === 'halal' || $status === 'compliant';
            if (!$isHalal) {
                continue;
            }

            $screening = $company->aaoifiScreening;
            $ratio = (float) ($screening?->impermissible_income_ratio ?? 0);
            if ($ratio <= 0) {
                // Stock is 100% clean, no purification needed
                continue;
            }

            // Find users holding shares in this stock
            $holdings = Holding::where('symbol', $company->symbol)
                ->where('shares', '>', 0)
                ->with('user')
                ->get();

            foreach ($holdings as $holding) {
                $user = $holding->user;
                if (!$user || !$user->email) {
                    continue;
                }

                $cacheKey = "div_purif_sent_{$user->id}_{$dividend->id}";
                if (Cache::has($cacheKey)) {
                    continue; // Already notified
                }

                // Calculate purification due
                $totalDiv = (float) $holding->shares * (float) $dividend->amount;
                $purificationDue = $totalDiv * ($ratio / 100);

                if (round($purificationDue, 2) <= 0) {
                    continue;
                }

                try {
                    // Send Email Notification
                    $user->notify(new DividendPurificationDueNotification(
                        $company,
                        $holding,
                        $dividend,
                        round($purificationDue, 2)
                    ));

                    // Create In-App Notification in user's inbox
                    UserNotification::create([
                        'user_id' => $user->id,
                        'icon' => 'droplet',
                        'title' => "Dividend Purification Due: {$company->symbol}",
                        'message' => "{$company->name} ({$company->symbol}) paid a dividend today. You have ₦" . number_format($purificationDue, 2) . " due for purification.",
                        'category' => 'purification',
                        'action_url' => '/portfolio#purification',
                        'action_label' => 'Purify Now',
                        'meta' => [
                            'dividend_id' => $dividend->id,
                            'symbol' => $company->symbol,
                            'amount_due' => round($purificationDue, 2),
                        ],
                    ]);

                    Cache::put($cacheKey, true, now()->addDays(14));
                    $this->info("Notified {$user->email} for {$company->symbol} dividend (₦" . round($purificationDue, 2) . ")");
                    $notifiedCount++;
                } catch (\Throwable $e) {
                    Log::error("Failed to send dividend purification notification to {$user->email}: " . $e->getMessage());
                    $this->error("Error notifying {$user->email}: " . $e->getMessage());
                }
            }
        }

        $this->info("Completed dividend purification checks. Sent {$notifiedCount} notifications.");
        return 0;
    }
}
