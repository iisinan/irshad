<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PriceMovementAlert extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $symbol;
    public $direction;
    public $changePct;
    public $currentPrice;

    public function __construct(User $user, string $symbol, string $direction, float $changePct, float $currentPrice)
    {
        $this->user = $user;
        $this->symbol = $symbol;
        $this->direction = $direction;
        $this->changePct = $changePct;
        $this->currentPrice = $currentPrice;
    }

    public function envelope(): Envelope
    {
        $arrow = $this->direction === 'up' ? '📈' : '📉';
        return new Envelope(
            subject: "{$arrow} Price Movement Alert: {$this->symbol} is {$this->direction} " . number_format($this->changePct, 2) . "%",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.price_movement',
            with: [
                'firstName' => explode(' ', $this->user->name)[0],
            ]
        );
    }
}
