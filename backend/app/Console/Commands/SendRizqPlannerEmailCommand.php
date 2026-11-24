<?php

namespace App\Console\Commands;

use App\Mail\RizqPlannerAnnouncementEmail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Throwable;

class SendRizqPlannerEmailCommand extends Command
{
    protected $signature = 'irshad:send-rizq-planner-email
                            {--dry-run : Preview target user counts without sending emails}
                            {--test-email= : Send a single preview email immediately to a test address}
                            {--verified-only : Only email users with verified email addresses}
                            {--reset : Include users who already received the Rizq Planner email}
                            {--force : Send without interactive confirmation}';

    protected $description = 'Send the Monthly Rizq Compounder Planner announcement email to Irshad users.';

    public function handle(): int
    {
        $testEmail = $this->option('test-email');
        if ($testEmail) {
            if (! filter_var($testEmail, FILTER_VALIDATE_EMAIL)) {
                $this->error("Invalid --test-email address: {$testEmail}");
                return self::FAILURE;
            }

            try {
                $previewUser = User::where('email', $testEmail)->first();
            } catch (Throwable) {
                $previewUser = null;
            }

            $previewUser ??= new User(['name' => 'Investor', 'email' => $testEmail]);

            Mail::to($testEmail)->sendNow(new RizqPlannerAnnouncementEmail($previewUser));
            $this->info("Sent preview Rizq Planner email to {$testEmail}.");

            return self::SUCCESS;
        }

        $hasTrackingCol = Schema::hasColumn('users', 'rizq_planner_email_sent_at');

        $query = User::query()
            ->whereNotNull('email')
            ->where('email', '!=', '');

        if ($this->option('verified-only')) {
            $query->whereNotNull('email_verified_at');
        }

        if ($hasTrackingCol && ! $this->option('reset')) {
            $query->whereNull('rizq_planner_email_sent_at');
        }

        $totalEligible = (clone $query)->count();
        $verifiedCount = (clone $query)->whereNotNull('email_verified_at')->count();

        $this->info('Mailer: ' . config('mail.default') . ' | From: ' . config('mail.from.address'));
        $this->info("Eligible recipients: {$totalEligible} ({$verifiedCount} verified)");

        if ($this->option('dry-run')) {
            $this->comment('Dry run enabled — no emails were sent.');
            return self::SUCCESS;
        }

        if ($totalEligible === 0) {
            $this->info('No pending users to email.');
            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm("Send Rizq Planner announcement to {$totalEligible} user(s) now?")) {
            $this->warn('Aborted.');
            return self::SUCCESS;
        }

        $sent = 0;
        $skipped = 0;
        $failed = 0;

        $query->orderBy('id')->chunkById(50, function ($users) use ($hasTrackingCol, &$sent, &$skipped, &$failed) {
            foreach ($users as $user) {
                $email = trim((string) $user->email);
                if (
                    ! filter_var($email, FILTER_VALIDATE_EMAIL)
                    || preg_match('/@(example\.(com|org|net)|localhost|.*\.test|.*\.local|mailinator\.com|yopmail\.com)$/i', $email)
                ) {
                    $skipped++;
                    continue;
                }

                try {
                    Mail::to($email)->send(new RizqPlannerAnnouncementEmail($user));
                    if ($hasTrackingCol) {
                        $user->forceFill(['rizq_planner_email_sent_at' => now()])->saveQuietly();
                    }
                    $sent++;
                    // Stay comfortably below AWS SES per-second throttle in sync mode.
                    if (config('queue.default') === 'sync') {
                        usleep(100000);
                    }
                } catch (Throwable $e) {
                    $failed++;
                    Log::warning('Rizq Planner announcement email failed', [
                        'user_id' => $user->id,
                        'email' => $email,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });

        $this->info("Rizq Planner email run complete: {$sent} sent, {$skipped} skipped, {$failed} failed.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
