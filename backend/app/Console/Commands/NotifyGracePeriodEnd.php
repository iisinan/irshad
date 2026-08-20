<?php

namespace App\Console\Commands;

use App\Models\Holding;
use App\Notifications\GracePeriodEndedNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class NotifyGracePeriodEnd extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'irshad:notify-grace-period-end';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send email notifications to users whose grace period has expired for non-compliant holdings.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for expired holding grace periods...');

        // Find holdings where the grace period ended today or before, and not yet notified
        $expiredHoldings = Holding::with(['user', 'company'])
            ->whereNotNull('grace_period_ends_at')
            ->where('grace_period_ends_at', '<=', now())
            ->where('grace_period_notified', false)
            ->get();

        $count = 0;
        foreach ($expiredHoldings as $holding) {
            if ($holding->user) {
                try {
                    $holding->user->notify(new GracePeriodEndedNotification($holding));
                    $holding->update(['grace_period_notified' => true]);
                    $this->info("Notified user {$holding->user->id} for holding {$holding->symbol}");
                    $count++;
                } catch (\Exception $e) {
                    Log::error("Failed to notify user {$holding->user->id} for grace period end of {$holding->symbol}: " . $e->getMessage());
                }
            }
        }

        $this->info("Done. Sent {$count} grace period expiration notifications.");
    }
}
