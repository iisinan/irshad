<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RizqPlannerAnnouncementEmail extends Mailable implements ShouldQueue
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
            subject: 'Plan Every Naira Before Payday — Meet the Irshad Monthly Rizq Planner',
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
            markdown: 'emails.rizq_planner_announcement',
            with: [
                'firstName' => $firstName,
                'rizqPlannerUrl' => $frontendUrl . '/rizq-planner',
            ],
        );
    }
}
