<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UpdatesDigestMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $userPerformances;
    public $topGainers;
    public $topLosers;
    public $dividendsThisWeek;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, array $userPerformances, array $topGainers, array $topLosers, $dividendsThisWeek)
    {
        $this->user = $user;
        $this->userPerformances = $userPerformances;
        $this->topGainers = $topGainers;
        $this->topLosers = $topLosers;
        $this->dividendsThisWeek = $dividendsThisWeek;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '📊 Your Weekly Irshad Market Digest',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.updates.digest',
            with: [
                'name'               => $this->user->first_name ?? explode(' ', $this->user->name)[0] ?? $this->user->name,
                'updatesUrl'         => config('app.frontend_url', 'https://iirshad.com').'/updates',
                'userPerformances'   => $this->userPerformances,
                'topGainers'         => $this->topGainers,
                'topLosers'          => $this->topLosers,
                'dividendsThisWeek'  => $this->dividendsThisWeek,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
