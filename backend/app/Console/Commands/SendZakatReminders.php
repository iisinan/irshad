<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\ZakatReminderNotification;
use Carbon\Carbon;
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

        $users = User::whereNotNull('preferences')->get();
        $count = 0;

        foreach ($users as $user) {
            $hawlDate = $user->preferences['zakat_hawl_date'] ?? null;
            if (! $hawlDate) {
                continue;
            }

            try {
                // The hawl date from preferences
                $start = Carbon::parse($hawlDate)->startOfDay();

                // Today at midnight
                $today = Carbon::now()->startOfDay();

                $due = $start->copy();
                if ($due->isBefore($today)) {
                    $daysPassed = $start->diffInDays($today, false);
                    $cycles = (int) ceil($daysPassed / 354);
                    if ($cycles < 1) {
                        $cycles = 1;
                    }
                    $due->addDays($cycles * 354);
                }

                // Diff in days
                $daysRemaining = $today->diffInDays($due->startOfDay(), false);

                // Check if we should remind them (30 days, 7 days, or 0 days)
                if (in_array($daysRemaining, [30, 7, 0])) {
                    $user->notify(new ZakatReminderNotification($daysRemaining, $due->format('M j, Y')));
                    $this->info("Sent Zakat reminder to {$user->email} ({$daysRemaining} days remaining)");
                    $count++;
                }
            } catch (\Exception $e) {
                $this->error("Error processing Zakat reminder for User ID {$user->id}: ".$e->getMessage());
            }
        }

        $this->info("Completed. Sent {$count} reminders.");
    }
}
