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
        $convId = $this->suggestion->chat_conversation_id;
        $inboxUrl = rtrim((string) config('app.frontend_url'), '/').'/admin/inbox'.($convId ? '?conversation_id='.$convId : '');
        $subject = $convId
            ? 'Chat Needs Admin Attention — Irshad'
            : 'New Suggestion Received for Irshad';
        $intro = $convId
            ? "**{$userName} ({$userEmail})** started an AI chat that needs admin attention. You can jump right into this thread and reply live."
            : "A new suggestion or feedback has been submitted by **{$userName} ({$userEmail})**.";

        $mail = (new MailMessage)
            ->subject($subject)
            ->greeting('As-salamu alaykum, Admin!')
            ->line($intro)
            ->line('**Details:**')
            ->line($this->suggestion->message)
            ->action($convId ? 'Reply in Live Chat' : 'View Admin Inbox', $inboxUrl)
            ->line('Jazakallah Khair,')
            ->salutation('The Irshad System');

        if ($this->suggestion->user && $this->suggestion->user->email) {
            $mail->replyTo($this->suggestion->user->email, $userName);
        }

        return $mail;
    }
}
