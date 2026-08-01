<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
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
        $subject = $this->daysRemaining === 0 
            ? 'Your Zakat is Due Today 🌙' 
            : "Your Zakat is Due in {$this->daysRemaining} Days 🌙";

        $greeting = "As-salamu Alaykum {$notifiable->name},";
        
        $message = $this->daysRemaining === 0
            ? "Your Hawl (one lunar year) has completed today, **{$this->dueDate}**. It is time to calculate and pay your Zakat."
            : "This is a friendly reminder that your Hawl (one lunar year) will complete on **{$this->dueDate}**, which is in {$this->daysRemaining} days.";

        return (new MailMessage)
                    ->subject($subject)
                    ->greeting($greeting)
                    ->line($message)
                    ->line('You can use the Irshad Zakat Calculator to accurately determine your obligation across your financial wealth, livestock, and agriculture.')
                    ->action('Calculate My Zakat', config('app.frontend_url', 'https://iirshad.com') . '/portfolio#zakat')
                    ->line('JazakAllah Khair for trusting Irshad with your portfolio.');
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
