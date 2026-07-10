<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StockStatusUpdatedNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public $company;
    public $status;

    /**
     * Create a new notification instance.
     */
    public function __construct(\App\Models\Company $company, \App\Models\StockStatus $status)
    {
        $this->company = $company;
        $this->status = $status;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // Add 'fcm' or custom channel here once google-services.json is added
        return ['database'];
    }

    /**
     * Get the array representation of the notification (for Database channel).
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $statusStr = ucfirst($this->status->status);
        return [
            'title' => "{$this->company->symbol} Status Changed",
            'body' => "{$this->company->name} is now classified as {$statusStr}.",
            'type' => 'stock',
            'reference_id' => $this->company->symbol,
            'status' => $this->status->status
        ];
    }
    
    /**
     * Placeholder for FCM push notification payload.
     * Use a package like kreait/laravel-firebase to actually send this.
     */
    public function toFcm($notifiable)
    {
        return [
            'token' => $notifiable->fcm_token,
            'notification' => [
                'title' => "{$this->company->symbol} Status Changed",
                'body' => "{$this->company->name} is now classified as " . ucfirst($this->status->status) . ".",
            ],
            'data' => [
                'type' => 'stock',
                'reference_id' => $this->company->symbol,
            ],
        ];
    }
}
