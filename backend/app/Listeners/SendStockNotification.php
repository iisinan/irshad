<?php

namespace App\Listeners;

use App\Events\StockStatusChanged;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

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
        $userIds = \App\Models\Favorite::where('type', 'stock')
            ->where('reference_id', $company->symbol)
            ->pluck('user_id');

        $users = \App\Models\User::whereIn('id', $userIds)->get();

        foreach ($users as $user) {
            $user->notify(new \App\Notifications\StockStatusUpdatedNotification($company, $status));
        }
    }
}
