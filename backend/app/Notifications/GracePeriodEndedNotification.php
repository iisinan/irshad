<?php

namespace App\Notifications;

use App\Models\Holding;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GracePeriodEndedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $holding;

    /**
     * Create a new notification instance.
     */
    public function __construct(Holding $holding)
    {
        $this->holding = $holding;
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
        $companyName = $this->holding->company ? $this->holding->company->name : $this->holding->symbol;
        $firstName = $notifiable->first_name ?? explode(' ', $notifiable->name)[0] ?? 'there';

        return (new MailMessage)
            ->subject('URGENT: Grace Period Expired for '.$this->holding->symbol)
            ->greeting('As-salamu alaykum, '.$firstName.'!')
            ->line('The 90-day grace period for your non-compliant holding in **'.$companyName.' ('.$this->holding->symbol.')** has officially ended.')
            ->line('Scholarly consensus requires that you sell your shares immediately to ensure your portfolio remains Shariah-compliant.')
            ->line('Any capital gains accrued after this date must be purified and donated to charity, as holding the stock beyond the grace period is not permissible.')
            ->action('Manage Portfolio', config('app.frontend_url') . '/portfolio')
            ->line('May Allah keep your wealth pure and bless your investments.')
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
