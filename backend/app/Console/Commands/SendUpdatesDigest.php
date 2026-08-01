<?php

namespace App\Console\Commands;

use App\Mail\UpdatesDigestMail;
use App\Models\WeeklyDigestPreference;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendUpdatesDigest extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'irshad:send-updates-digest';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send the weekly/monthly digest of portfolio and market updates to opted-in users.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to send Updates Digest...');

        // Find users who opted in for emails and are scheduled for today
        // For simplicity, we just send to all users who enabled email delivery for their digest.
        $preferences = WeeklyDigestPreference::where('email_enabled', true)
            ->with('user')
            ->get();

        if ($preferences->isEmpty()) {
            $this->info('No users opted in for the email digest.');

            return self::SUCCESS;
        }

        foreach ($preferences as $pref) {
            if (! $pref->user) {
                continue;
            }

            try {
                Mail::to($pref->user->email)->send(new UpdatesDigestMail($pref->user));
                $this->info("Sent digest to {$pref->user->email}");
            } catch (\Exception $e) {
                $this->error("Failed to send digest to {$pref->user->email}: ".$e->getMessage());
            }
        }

        $this->info('Updates Digest delivery completed.');

        return self::SUCCESS;
    }
}
