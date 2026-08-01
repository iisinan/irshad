<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SendZakatReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-zakat-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Zakat Reminders check...');

        $users = \App\Models\User::whereNotNull('preferences')->get();
        $count = 0;

        foreach ($users as $user) {
            $hawlDate = $user->preferences['zakat_hawl_date'] ?? null;
            if (!$hawlDate) continue;

            try {
                // The hawl date from preferences
                $start = \Carbon\Carbon::parse($hawlDate);
                
                // Add 354 days to get the due date
                $due = $start->copy()->addDays(354);
                
                // Today at midnight
                $today = \Carbon\Carbon::now()->startOfDay();
                
                // Diff in days
                $daysRemaining = $today->diffInDays($due->startOfDay(), false);

                // Check if we should remind them (30 days, 7 days, or 0 days)
                if (in_array($daysRemaining, [30, 7, 0])) {
                    $user->notify(new \App\Notifications\ZakatReminderNotification($daysRemaining, $due->format('M j, Y')));
                    $this->info("Sent Zakat reminder to {$user->email} ({$daysRemaining} days remaining)");
                    $count++;
                }
            } catch (\Exception $e) {
                $this->error("Error processing Zakat reminder for User ID {$user->id}: " . $e->getMessage());
            }
        }

        $this->info("Completed. Sent {$count} reminders.");
    }
}
