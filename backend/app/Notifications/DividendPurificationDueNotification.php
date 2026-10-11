<?php

namespace App\Notifications;

use App\Models\Company;
use App\Models\Dividend;
use App\Models\Holding;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DividendPurificationDueNotification extends Notification
{
    use Queueable;

    public Company $company;
    public Holding $holding;
    public Dividend $dividend;
    public float $purificationDue;

    /**
     * Create a new notification instance.
     */
    public function __construct(Company $company, Holding $holding, Dividend $dividend, float $purificationDue)
    {
        $this->company = $company;
        $this->holding = $holding;
        $this->dividend = $dividend;
        $this->purificationDue = $purificationDue;
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
        $firstName = $notifiable->first_name ?? explode(' ', $notifiable->name ?? '')[0] ?? 'there';
        $symbol = $this->company->symbol ?? $this->holding->symbol;
        $companyName = $this->company->name ?? $symbol;
        $shares = number_format((float) $this->holding->shares);
        $divPerShare = number_format((float) ($this->dividend->amount ?? 0), 2);
        $totalDividends = number_format((float) ($this->holding->shares * ($this->dividend->amount ?? 0)), 2);
        $dueFormatted = number_format($this->purificationDue, 2);
        $ratio = number_format((float) ($this->company->aaoifiScreening?->impermissible_income_ratio ?? 0), 2);
        $payDate = $this->dividend->pay_date ? \Carbon\Carbon::parse($this->dividend->pay_date)->format('M j, Y') : 'today';

        $subject = "💧 Dividend Purification Due: {$symbol} paid today";

        return (new MailMessage)
            ->subject($subject)
            ->greeting('As-salamu alaykum, ' . $firstName . '!')
            ->line("**{$companyName} ({$symbol})** has officially paid its dividend of **₦{$divPerShare}/share** today, **{$payDate}**.")
            ->line("Based on your holding of **{$shares} shares**, your total dividend payout entitlement is **₦{$totalDividends}**.")
            ->line("Per AAOIFI Shariah standards, this company has an incidental impermissible income ratio of **{$ratio}%**. The purification amount due from this payout is **₦{$dueFormatted}**.")
            ->action('Purify My Dividend Now', config('app.frontend_url', 'https://iirshad.com') . '/portfolio#purification')
            ->line('Please donate this amount to an eligible charitable cause of your choice to ensure your investment income remains purified and blessed.')
            ->line('May Allah accept your good deeds and bless your lawful earnings.')
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
            'company_id' => $this->company->id ?? null,
            'symbol' => $this->company->symbol ?? $this->holding->symbol,
            'dividend_id' => $this->dividend->id ?? null,
            'purification_due' => $this->purificationDue,
        ];
    }
}
