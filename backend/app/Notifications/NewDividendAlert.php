<?php

namespace App\Notifications;

use App\Models\Dividend;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewDividendAlert extends Notification implements ShouldQueue
{
    use Queueable;

    public $dividend;

    /**
     * Create a new notification instance.
     */
    public function __construct(Dividend $dividend)
    {
        $this->dividend = $dividend;
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
        $symbol = $this->dividend->ticker;
        $amount = number_format($this->dividend->amount, 2);
        $currency = $this->dividend->currency ?? 'NGN';
        $payDate = $this->dividend->pay_date ? $this->dividend->pay_date->format('j F Y') : 'To Be Determined';
        $firstName = $notifiable->first_name ?? explode(' ', $notifiable->name)[0] ?? 'there';

        return (new MailMessage)
            ->subject('New Dividend Announced: '.$symbol)
            ->greeting('As-salamu alaykum, '.$firstName.'!')
            ->line('A new dividend has been announced for a stock in your Irshad portfolio: **'.$symbol.'**.')
            ->line('**Dividend Amount:** '.$currency.' '.$amount.' per share')
            ->line('**Payment Date:** '.$payDate)
            ->action('View Portfolio', config('app.frontend_url') . '/portfolio')
            ->line('Important: If '.$symbol.' is currently marked as Shariah Non-Compliant, any dividends received must be fully purified and donated to an Islamic charity.')
            ->line('May Allah bless your wealth and keep your finances pure.')
            ->salutation('Jazakallah Khair, The Irshad Team');
    }
}
