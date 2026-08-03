<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ZakatReminderNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public int $daysRemaining;

    public string $dueDate;

    /**
     * Create a new notification instance.
     */
    public function __construct(int $daysRemaining, string $dueDate)
    {
        $this->daysRemaining = $daysRemaining;
        $this->dueDate = $dueDate;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $firstName = $notifiable->first_name ?? explode(' ', $notifiable->name)[0] ?? 'there';

        $subject = $this->daysRemaining === 0
            ? '🌙 Your Zakat is Due Today'
            : "🌙 Zakat Reminder: Due in {$this->daysRemaining} " . ($this->daysRemaining === 1 ? 'Day' : 'Days');

        if ($this->daysRemaining === 0) {
            $bodyLine1 = "Your Hawl (one complete lunar year) has come full circle today, **{$this->dueDate}**. As a pillar of Islam and an act of worship, it is now time to calculate and pay your Zakat.";
            $bodyLine2 = 'Your Irshad Zakat Calculator is ready — it automatically evaluates your portfolio, cash, and other assets so you can fulfil your obligation with ease and accuracy.';
        } else {
            $bodyLine1 = "This is a gentle reminder that your Hawl (one complete lunar year) will conclude on **{$this->dueDate}**, which is in **{$this->daysRemaining} " . ($this->daysRemaining === 1 ? 'day' : 'days') . "**. Begin preparing your Zakat calculation early.";
            $bodyLine2 = 'The Irshad Zakat Calculator can help you accurately determine your full obligation across investments, savings, and other Zakatable assets.';
        }

        return (new MailMessage)
            ->subject($subject)
            ->greeting('As-salamu alaykum, '.$firstName.'!')
            ->line($bodyLine1)
            ->line($bodyLine2)
            ->action('Calculate My Zakat Now', config('app.frontend_url', 'https://iirshad.com').'/portfolio#zakat')
            ->line('May Allah accept your Zakat and purify your wealth. Ameen.')
            ->salutation('Jazakallah Khair, The Irshad Team');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
