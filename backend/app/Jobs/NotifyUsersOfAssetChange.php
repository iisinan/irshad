<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Watchlist;
use App\Models\Favorite;
use App\Models\User;
use App\Notifications\AssetStatusAlert;
use Illuminate\Support\Facades\Log;

class NotifyUsersOfAssetChange implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $asset;
    protected $oldStatus;
    protected $newStatus;
    protected $assetType;

    /**
     * Create a new job instance.
     *
     * @param mixed $asset
     * @param string $oldStatus
     * @param string $newStatus
     * @param string $assetType 'stock' or 'product'
     */
    public function __construct($asset, $oldStatus, $newStatus, $assetType)
    {
        $this->asset = $asset;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->assetType = $assetType;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $usersToNotify = []; // Format: userId => ['user' => User, 'channels' => ['mail', 'whatsapp']]

        if ($this->assetType === 'stock') {
            // Find in Watchlists (Web)
            $watchlists = Watchlist::where('symbol', $this->asset->symbol)
                ->where(function($query) {
                    $query->where('alert_email', true)->orWhere('alert_whatsapp', true);
                })->get();

            foreach ($watchlists as $wl) {
                if (!isset($usersToNotify[$wl->user_id])) {
                    $usersToNotify[$wl->user_id] = ['user_id' => $wl->user_id, 'channels' => []];
                }
                if ($wl->alert_email) $usersToNotify[$wl->user_id]['channels'][] = 'mail';
                if ($wl->alert_whatsapp) $usersToNotify[$wl->user_id]['channels'][] = 'whatsapp';
            }

            // Find in Favorites (Mobile)
            $favorites = Favorite::where('type', 'stock')
                ->where('reference_id', $this->asset->id)
                ->where(function($query) {
                    $query->where('alert_email', true)->orWhere('alert_whatsapp', true);
                })->get();

            foreach ($favorites as $fav) {
                if (!isset($usersToNotify[$fav->user_id])) {
                    $usersToNotify[$fav->user_id] = ['user_id' => $fav->user_id, 'channels' => []];
                }
                if ($fav->alert_email && !in_array('mail', $usersToNotify[$fav->user_id]['channels'])) {
                    $usersToNotify[$fav->user_id]['channels'][] = 'mail';
                }
                if ($fav->alert_whatsapp && !in_array('whatsapp', $usersToNotify[$fav->user_id]['channels'])) {
                    $usersToNotify[$fav->user_id]['channels'][] = 'whatsapp';
                }
            }
        } elseif ($this->assetType === 'product') {
            $favorites = Favorite::where('type', 'product')
                ->where('reference_id', $this->asset->id)
                ->where(function($query) {
                    $query->where('alert_email', true)->orWhere('alert_whatsapp', true);
                })->get();

            foreach ($favorites as $fav) {
                if (!isset($usersToNotify[$fav->user_id])) {
                    $usersToNotify[$fav->user_id] = ['user_id' => $fav->user_id, 'channels' => []];
                }
                if ($fav->alert_email) $usersToNotify[$fav->user_id]['channels'][] = 'mail';
                if ($fav->alert_whatsapp) $usersToNotify[$fav->user_id]['channels'][] = 'whatsapp';
            }
        }

        // Now fetch users in one query
        $userIds = array_keys($usersToNotify);
        if (empty($userIds)) {
            Log::info("No users tracking {$this->assetType} ID {$this->asset->id} with alerts enabled.");
            return;
        }

        $users = User::whereIn('id', $userIds)->get();

        foreach ($users as $user) {
            $channels = $usersToNotify[$user->id]['channels'];
            if (!empty($channels)) {
                $user->notify(new AssetStatusAlert($this->asset, $this->oldStatus, $this->newStatus, $this->assetType, $channels));
            }
        }
    }
}
