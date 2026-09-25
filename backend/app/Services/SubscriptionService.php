<?php

namespace App\Services;

use App\Models\User;
use App\Models\Holding;
use App\Models\Watchlist;
use App\Models\UserUsage;
use Carbon\Carbon;

class SubscriptionService
{
    public static function canAddPortfolio(User $user)
    {
        $limit = $user->tier->features['portfolio_limit'] ?? 0;
        if ($limit === -1) return true;
        
        $currentCount = Holding::where('user_id', $user->id)->count();
        return $currentCount < $limit;
    }

    public static function canAddWatchlist(User $user)
    {
        $limit = $user->tier->features['watchlist_limit'] ?? 0;
        if ($limit === -1) return true;
        
        $currentCount = Watchlist::where('user_id', $user->id)->count();
        return $currentCount < $limit;
    }

    public static function canUseFeature(User $user, string $featureKey)
    {
        $limit = $user->tier->features[$featureKey] ?? 0;
        
        // Booleans
        if (is_bool($limit)) return $limit;
        
        // Unlimited
        if ($limit === -1) return true;
        
        // Zero
        if ($limit === 0) return false;

        // Consumables (e.g. stock_screens_per_month)
        $usage = UserUsage::firstOrCreate(
            ['user_id' => $user->id, 'feature' => $featureKey],
            ['used_count' => 0, 'reset_at' => Carbon::now()->startOfMonth()->addMonth()]
        );

        if ($usage->reset_at && Carbon::now()->greaterThanOrEqualTo($usage->reset_at)) {
            $usage->update([
                'used_count' => 0,
                'reset_at' => Carbon::now()->startOfMonth()->addMonth()
            ]);
        }

        return $usage->used_count < $limit;
    }

    public static function recordFeatureUsage(User $user, string $featureKey)
    {
        $limit = $user->tier->features[$featureKey] ?? 0;
        if ($limit === -1 || is_bool($limit)) return; // Don't track unlimited/boolean

        $usage = UserUsage::firstOrCreate(
            ['user_id' => $user->id, 'feature' => $featureKey],
            ['used_count' => 0, 'reset_at' => Carbon::now()->startOfMonth()->addMonth()]
        );

        $usage->increment('used_count');
    }
}
