<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * This notification implements ShouldQueue so that sending the
 * password reset email is handled by the Redis queue worker,
 * making the HTTP response instant for the user.
 */
class QueuedResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public string $token;

    public function __construct(string $token)
    {
        $this->token = $token;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $resetUrl = config('app.frontend_url', 'http://localhost:5173')
            .'/reset-password?token='.$this->token
            .'&email='.urlencode($notifiable->getEmailForPasswordReset());

        $firstName = $notifiable->first_name ?? explode(' ', $notifiable->name)[0] ?? 'there';

        return (new MailMessage)
            ->subject('Reset Your Irshad Password')
            ->greeting('As-salamu alaykum, '.$firstName.'!')
            ->line('We received a request to reset the password for your Irshad account.')
            ->line('Click the button below to choose a new password. This link is valid for **60 minutes**.')
            ->action('Reset My Password', $resetUrl)
            ->line('If you did not request a password reset, please ignore this email — your account remains secure and no changes have been made.')
            ->line('For your security, never share this link with anyone.')
            ->salutation('Jazakallah Khair, The Irshad Team');
    }
}
