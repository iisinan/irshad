<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
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
            subject: 'Daily Financial Screening Batch Completed',
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
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
