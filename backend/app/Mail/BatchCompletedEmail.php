<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BatchCompletedEmail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public $batchId;

    public $totalJobs;

    public $processedJobs;

    public $failedJobs;

    /**
     * Create a new message instance.
     */
    public function __construct($batchId, $totalJobs, $processedJobs, $failedJobs)
    {
        $this->batchId = $batchId;
        $this->totalJobs = $totalJobs;
        $this->processedJobs = $processedJobs;
        $this->failedJobs = $failedJobs;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '✅ Irshad: Daily Market Screening Complete',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.batch-completed',
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
