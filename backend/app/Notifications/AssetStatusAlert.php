<?php

namespace App\Notifications;

use App\Channels\WhatsAppChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

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
     * @param  mixed  $asset  The Company or Product model
     * @param  string  $oldStatus
     * @param  string  $newStatus
     * @param  string  $assetType  'stock' or 'product'
     * @param  array  $channels  Array of channels to send to, e.g. ['mail', 'whatsapp']
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
     * @return MailMessage
     */
    public function toMail($notifiable)
    {
        $assetName = $this->assetType === 'stock' ? $this->asset->name.' ('.$this->asset->symbol.')' : $this->asset->name;
        $oldFormatted = ucfirst($this->oldStatus);
        $newFormatted = ucfirst($this->newStatus);
        $firstName = $notifiable->first_name ?? explode(' ', $notifiable->name)[0] ?? 'there';

        $isNowNonHalal = strtolower($this->newStatus) === 'non-halal';
        $isNowHalal    = strtolower($this->newStatus) === 'halal';

        if ($isNowNonHalal) {
            $contextLine = '**'.$assetName.'** has changed its Shariah compliance status from **'.$oldFormatted.'** to **'.$newFormatted.'**.';
            $actionLine  = 'We recommend reviewing your portfolio and considering whether to divest from this asset to keep your investments aligned with your values.';
        } elseif ($isNowHalal) {
            $contextLine = '**'.$assetName.'** has been reclassified as **'.$newFormatted.'** (previously: '.$oldFormatted.').';
            $actionLine  = 'You may now consider adding this asset to your portfolio if it aligns with your investment goals.';
        } else {
            $contextLine = '**'.$assetName.'** has been updated from **'.$oldFormatted.'** to **'.$newFormatted.'**.';
            $actionLine  = 'You can review the full details and updated AAOIFI screening report on your Irshad dashboard.';
        }

        return (new MailMessage)
            ->subject('Irshad Alert: '.$assetName.' — Status Changed to '.$newFormatted)
            ->greeting('As-salamu alaykum, '.$firstName.'!')
            ->line('We are writing to inform you of an important change affecting an asset on your Watchlist.')
            ->line($contextLine)
            ->line($actionLine)
            ->action('View on Irshad', url('/watchlist'))
            ->line('May Allah bless your wealth and keep your finances pure.')
            ->salutation('Jazakallah Khair, The Irshad Team');
    }

    /**
     * Get the WhatsApp representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return string
     */
    public function toWhatsApp($notifiable)
    {
        $assetName = $this->assetType === 'stock' ? $this->asset->name.' ('.$this->asset->symbol.')' : $this->asset->name;
        $oldFormatted = ucfirst($this->oldStatus);
        $newFormatted = ucfirst($this->newStatus);

        return "Assalamu Alaikum {$notifiable->name},\n\n*Irshad Alert:*\n{$assetName} has changed its Shariah status from *{$oldFormatted}* to *{$newFormatted}*.\n\nPlease check your Irshad app for more details.\nhttps://irshad.app/watchlist";
    }
}
