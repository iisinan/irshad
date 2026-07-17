<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Channels\WhatsAppChannel;

class AssetStatusAlert extends Notification implements ShouldQueue
{
    use Queueable;

    protected $asset;
    protected $oldStatus;
    protected $newStatus;
    protected $assetType;
    protected $channels;

    /**
     * Create a new notification instance.
     *
     * @param mixed $asset The Company or Product model
     * @param string $oldStatus
     * @param string $newStatus
     * @param string $assetType 'stock' or 'product'
     * @param array $channels Array of channels to send to, e.g. ['mail', 'whatsapp']
     */
    public function __construct($asset, $oldStatus, $newStatus, $assetType, array $channels)
    {
        $this->asset = $asset;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->assetType = $assetType;
        $this->channels = $channels;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        $resolvedChannels = [];
        foreach ($this->channels as $channel) {
            if ($channel === 'mail') {
                $resolvedChannels[] = 'mail';
            } elseif ($channel === 'whatsapp') {
                $resolvedChannels[] = WhatsAppChannel::class;
            }
        }
        return $resolvedChannels;
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $assetName = $this->assetType === 'stock' ? $this->asset->name . ' (' . $this->asset->symbol . ')' : $this->asset->name;
        $oldFormatted = ucfirst($this->oldStatus);
        $newFormatted = ucfirst($this->newStatus);
        
        $warning = strtolower($this->newStatus) === 'non-halal' 
            ? 'Please review your portfolio, as this asset no longer complies with Shariah standards.'
            : 'You can review the updated status and details on your Irshad dashboard.';

        return (new MailMessage)
                    ->subject('Irshad Alert: ' . $assetName . ' Status Update')
                    ->greeting('Assalamu Alaikum, ' . $notifiable->name . '!')
                    ->line('This is an important update regarding an item on your Watchlist.')
                    ->line("**{$assetName}** has been updated from **{$oldFormatted}** to **{$newFormatted}**.")
                    ->line($warning)
                    ->action('View Watchlist', url('/watchlist'))
                    ->line('Thank you for using Irshad to keep your finances pure.');
    }

    /**
     * Get the WhatsApp representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return string
     */
    public function toWhatsApp($notifiable)
    {
        $assetName = $this->assetType === 'stock' ? $this->asset->name . ' (' . $this->asset->symbol . ')' : $this->asset->name;
        $oldFormatted = ucfirst($this->oldStatus);
        $newFormatted = ucfirst($this->newStatus);

        return "Assalamu Alaikum {$notifiable->name},\n\n*Irshad Alert:*\n{$assetName} has changed its Shariah status from *{$oldFormatted}* to *{$newFormatted}*.\n\nPlease check your Irshad app for more details.\nhttps://irshad.app/watchlist";
    }
}
