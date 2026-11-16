<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LaunchAnnouncementEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Irshad Goes Live December 1st — What’s Coming for Halal Investors',
        );
    }

    public function content(): Content
    {
        $firstName = trim(explode(' ', (string) $this->user->name)[0] ?? '');
        if ($firstName === '') {
            $firstName = 'Investor';
        }

        $frontendUrl = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'https://iirshad.com')), '/');

        return new Content(
            markdown: 'emails.launch_announcement',
            with: [
                'firstName' => $firstName,
                'dashboardUrl' => $frontendUrl . '/portfolio',
                'pricingUrl' => $frontendUrl . '/pricing',
            ],
        );
    }
}
