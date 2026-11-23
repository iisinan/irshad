<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public User $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function envelope(): Envelope
    {
        if ($this->user->role === 'institution') {
            $institutionName = trim((string) ($this->user->institution_name ?: $this->user->name));
            return new Envelope(
                subject: "Welcome to Irshad Institutional — {$institutionName}",
            );
        }

        return new Envelope(
            subject: 'Welcome to Irshad — Your Shariah-Compliant Investment Companion',
        );
    }

    public function content(): Content
    {
        $firstName = trim(explode(' ', (string) $this->user->name)[0] ?? '');
        if ($firstName === '') {
            $firstName = $this->user->role === 'institution' ? 'Partner' : 'Investor';
        }

        $frontendUrl = rtrim((string) config('app.frontend_url', env('FRONTEND_URL', 'https://iirshad.com')), '/');

        if ($this->user->role === 'institution') {
            return new Content(
                markdown: 'emails.welcome_institution',
                with: [
                    'firstName' => $firstName,
                    'institutionName' => trim((string) ($this->user->institution_name ?: $this->user->name)),
                    'institutionType' => trim((string) ($this->user->institution_type ?: 'Institutional Partner')),
                    'userEmail' => $this->user->email,
                    'institutionUrl' => $frontendUrl . '/institution',
                    'loginUrl' => $frontendUrl . '/login',
                ],
            );
        }

        return new Content(
            markdown: 'emails.welcome',
            with: [
                'firstName' => $firstName,
                'dashboardUrl' => $frontendUrl . '/portfolio',
                'pricingUrl' => $frontendUrl . '/pricing',
            ],
        );
    }
}
