<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Suggestion;

class AdminSuggestionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $suggestion;

    public function __construct(Suggestion $suggestion)
    {
        $this->suggestion = $suggestion;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $userName = $this->suggestion->user ? ($this->suggestion->user->name ?? $this->suggestion->user->first_name) : 'A user';
        $userEmail = $this->suggestion->user ? $this->suggestion->user->email : 'No email provided';

        $mail = (new MailMessage)
            ->subject('New Suggestion Received for Irshad')
            ->greeting('As-salamu alaykum, Admin!')
            ->line('A new suggestion or feedback has been submitted by **' . $userName . ' (' . $userEmail . ')**.')
            ->line('**Suggestion Details:**')
            ->line($this->suggestion->message)
            ->action('View Admin Inbox', config('app.frontend_url') . '/admin/inbox')
            ->line('Jazakallah Khair,')
            ->salutation('The Irshad System');

        if ($this->suggestion->user && $this->suggestion->user->email) {
            $mail->replyTo($this->suggestion->user->email, $userName);
        }

        return $mail;
    }
}
