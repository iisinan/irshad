<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class TestMailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test 
                            {email? : The recipient email address} 
                            {--mailer= : The mailer transport to use (e.g. ses, smtp, log)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test email to verify Amazon SES or SMTP configuration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $to = $this->argument('email') ?: $this->ask('Enter recipient email address');
        if (! $to || ! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            $this->error('Please provide a valid email address.');
            return 1;
        }

        $mailerName = $this->option('mailer') ?: config('mail.default');
        $fromAddress = config('mail.from.address');
        $fromName = config('mail.from.name', 'Irshad');

        $this->info("=== Amazon SES / Mail Configuration Test ===");
        $this->line("Mailer:       <comment>{$mailerName}</comment>");
        $this->line("From:         <comment>{$fromName} <{$fromAddress}></comment>");
        $this->line("To:           <comment>{$to}</comment>");

        if ($mailerName === 'ses') {
            $region = config('services.ses.region', 'us-east-1');
            $endpoint = config('services.ses.endpoint', 'default');
            $hasKey = ! empty(config('services.ses.key'));
            $hasSecret = ! empty(config('services.ses.secret'));

            $this->line("SES Region:   <comment>{$region}</comment>");
            $this->line("SES Endpoint: <comment>{$endpoint}</comment>");
            $this->line("SES Key:      " . ($hasKey ? '<info>Configured</info>' : '<error>Missing</error>'));
            $this->line("SES Secret:   " . ($hasSecret ? '<info>Configured</info>' : '<error>Missing</error>'));
        } elseif ($mailerName === 'smtp') {
            $host = config('mail.mailers.smtp.host');
            $port = config('mail.mailers.smtp.port');
            $this->line("SMTP Host:    <comment>{$host}:{$port}</comment>");
        }

        $this->newLine();
        $this->info("Dispatching test email via [{$mailerName}]...");

        try {
            Mail::mailer($mailerName)->raw(
                "As-salamu alaykum,\n\nThis is a test email sent from Irshad via the [{$mailerName}] mailer at " . now()->toRfc2822String() . ".\n\nYour Amazon SES email delivery is operational!\n\n— Irshad Engineering",
                function ($message) use ($to, $fromAddress, $fromName, $mailerName) {
                    $message->to($to)
                        ->from($fromAddress, $fromName)
                        ->subject("Irshad Mail Test: {$mailerName} (" . now()->format('Y-m-d H:i') . ")");
                }
            );

            $this->info("✓ Test email sent successfully to {$to}!");
            return 0;
        } catch (Throwable $e) {
            $this->newLine();
            $this->error("✗ Failed to send email: " . $e->getMessage());

            if (str_contains($e->getMessage(), 'MessageRejected') || str_contains($e->getMessage(), 'Email address is not verified')) {
                $this->warn("\nTroubleshooting hint: AWS SES requires verifying sender '{$fromAddress}' or the entire domain in the us-east-1 region.");
            } elseif (str_contains($e->getMessage(), 'InvalidClientTokenId') || str_contains($e->getMessage(), 'SignatureDoesNotMatch')) {
                $this->warn("\nTroubleshooting hint: Please verify your AWS_SES_KEY and AWS_SES_SECRET in .env.");
            }

            return 1;
        }
    }
}
