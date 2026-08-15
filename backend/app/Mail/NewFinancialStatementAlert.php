<?php

namespace App\Mail;

use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewFinancialStatementAlert extends Mailable
{
    use Queueable, SerializesModels;

    public Company $company;
    public string $disclosureTitle;
    public ?string $pdfUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(Company $company, string $disclosureTitle, ?string $pdfUrl)
    {
        $this->company = $company;
        $this->disclosureTitle = $disclosureTitle;
        $this->pdfUrl = $pdfUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New Financial Statement Alert: {$this->company->symbol}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.new_financial_statement',
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
