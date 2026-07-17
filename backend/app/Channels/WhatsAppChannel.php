<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class WhatsAppChannel
{
    /**
     * Send the given notification.
     *
     * @param  mixed  $notifiable
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return void
     */
    public function send($notifiable, Notification $notification)
    {
        // Check if method exists
        if (! method_exists($notification, 'toWhatsApp')) {
            return;
        }

        $message = $notification->toWhatsApp($notifiable);

        if (! $message) {
            return;
        }

        // Get the phone number, either from a generic routeNotificationFor method or directly from the model
        $phoneNumber = null;
        if (method_exists($notifiable, 'routeNotificationForWhatsApp')) {
            $phoneNumber = $notifiable->routeNotificationForWhatsApp($notification);
        } elseif (isset($notifiable->phone_number)) {
            $phoneNumber = $notifiable->phone_number;
        }

        if (! $phoneNumber) {
            Log::warning('WhatsAppChannel: Missing phone number for notifiable ID ' . ($notifiable->id ?? 'unknown'));
            return;
        }

        // Simulating the WhatsApp API payload delivery
        Log::channel('single')->info("================ WHATSAPP ALERT DISPATCHED ================");
        Log::channel('single')->info("To: {$phoneNumber}");
        Log::channel('single')->info("Message:\n{$message}");
        Log::channel('single')->info("==========================================================");
    }
}
