<?php

namespace App\Observers;

use App\Models\Dividend;
use App\Models\Holding;
use App\Notifications\NewDividendAlert;
use Illuminate\Support\Facades\Log;

class DividendObserver
{
    /**
     * Handle the Dividend "created" event.
     */
    public function created(Dividend $dividend): void
    {
        // Find all users who currently hold this stock
        $holdings = Holding::with('user')->where('symbol', $dividend->ticker)->get();

        foreach ($holdings as $holding) {
            if ($holding->user) {
                try {
                    $holding->user->notify(new NewDividendAlert($dividend));
                } catch (\Exception $e) {
                    Log::error("Failed to notify user {$holding->user->id} for new dividend of {$dividend->ticker}: " . $e->getMessage());
                }
            }
        }
    }
}
