<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ScraperAlert extends Mailable
{
    use Queueable, SerializesModels;

    public $status;
    public $details;

    /**
     * Create a new message instance.
     */
    public function __construct(string $status, string $details)
    {
        $this->status = $status;
        $this->details = $details;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subjectPrefix = $this->status === 'success' ? '✅ Success' : '🚨 ALERT';
        return new Envelope(
            subject: "{$subjectPrefix}: NGX Price Scraper",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.scraper_alert',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

