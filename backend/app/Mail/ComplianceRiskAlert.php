<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ComplianceRiskAlert extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $symbol;
    public $riskReasons;

    public function __construct(User $user, string $symbol, array $riskReasons)
    {
        $this->user = $user;
        $this->symbol = $symbol;
        $this->riskReasons = $riskReasons;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Compliance Risk Alert: ' . $this->symbol,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.compliance_risk',
            with: [
                'firstName' => explode(' ', $this->user->name)[0],
            ]
        );
    }
}
