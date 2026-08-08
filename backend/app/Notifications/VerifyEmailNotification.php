<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

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
        $verificationUrl = $this->verificationUrl($notifiable);

        $firstName = $notifiable->first_name ?? explode(' ', $notifiable->name)[0] ?? 'there';

        return (new MailMessage)
            ->subject('Verify Your Email Address — Irshad')
            ->greeting('As-salamu alaykum, '.$firstName.'!')
            ->line('Welcome to Irshad — your trusted Shariah-compliant investment companion.')
            ->line('To complete your registration and activate your account, please verify your email address by clicking the button below.')
            ->action('Verify My Email Address', $verificationUrl)
            ->line('This verification link will expire in **60 minutes**.')
            ->line('If you did not create an Irshad account, you can safely ignore this email.')
            ->salutation('Jazakallah Khair, The Irshad Team');
    }

    /**
     * Get the verification URL for the given notifiable.
     *
     * @param  mixed  $notifiable
     * @return string
     */
    protected function verificationUrl($notifiable)
    {
        // Generate the standard Laravel signed route for verification
        $apiUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        // Map it to the frontend URL
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'https://iirshad.com'));

        // Pass the signed API URL as a query parameter to the frontend
        return rtrim($frontendUrl, '/').'/verify-email?url='.urlencode($apiUrl);
    }
}
