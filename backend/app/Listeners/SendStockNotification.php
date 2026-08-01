<?php

namespace App\Listeners;

use App\Events\StockStatusChanged;
use App\Models\Favorite;
use App\Models\User;
use App\Notifications\StockStatusUpdatedNotification;

class SendStockNotification
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(StockStatusChanged $event): void
    {
        $company = $event->company;
        $status = $event->status;

        // Find all users who favorited this stock
        $userIds = Favorite::where('type', 'stock')
            ->where('reference_id', $company->symbol)
            ->pluck('user_id');

        $users = User::whereIn('id', $userIds)->get();

        foreach ($users as $user) {
            $user->notify(new StockStatusUpdatedNotification($company, $status));
        }
    }
}
