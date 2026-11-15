<?php

namespace App\Services;

use App\Models\Basket;
use App\Models\Holding;
use App\Models\User;
use App\Models\UserUsage;
use App\Models\Watchlist;
use Carbon\Carbon;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SubscriptionService
{
    public static function canAddPortfolio(User $user, int $additionalCount = 1): bool
    {
        $limit = $user->tier->features['portfolio_limit'] ?? 3;
        if ($limit === -1) {
            return true;
        }

        $currentCount = Holding::where('user_id', $user->id)->count();
        return ($currentCount + $additionalCount) <= $limit;
    }

    public static function canAddWatchlist(User $user, int $additionalCount = 1): bool
    {
        $limit = $user->tier->features['watchlist_limit'] ?? 0;
        if ($limit === -1) {
            return true;
        }
        if ($limit <= 0) {
            return false;
        }

        $currentCount = Watchlist::where('user_id', $user->id)->count();
        return ($currentCount + $additionalCount) <= $limit;
    }

    public static function canUseFeature(User $user, string $featureKey): bool
    {
        $limit = $user->tier->features[$featureKey] ?? 0;

        // Booleans
        if (is_bool($limit)) {
            return $limit;
        }

        // Unlimited
        if ($limit === -1) {
            return true;
        }

        // Zero
        if ($limit <= 0) {
            return false;
        }

        // Consumables (e.g. stock_screens_per_month, purifications_per_month)
        $usage = self::getOrResetMonthlyUsage($user, $featureKey);

        return $usage->used_count < $limit;
    }

    public static function recordFeatureUsage(User $user, string $featureKey): void
    {
        $limit = $user->tier->features[$featureKey] ?? 0;
        if ($limit === -1 || is_bool($limit)) {
            return; // Don't track unlimited/boolean
        }

        $usage = self::getOrResetMonthlyUsage($user, $featureKey);
        $usage->increment('used_count');
    }

    /**
     * Check whether a user can screen a specific stock symbol this month.
     * Re-viewing an already-screened symbol in the same calendar month is free.
     */
    public static function canScreenStock(User $user, string $symbol): bool
    {
        $limit = $user->tier->features['stock_screens_per_month'] ?? 3;
        if ($limit === -1) {
            return true;
        }
        if ($limit <= 0) {
            return false;
        }

        if (self::hasScreenedSymbolThisMonth($user, $symbol)) {
            return true;
        }

        return self::canUseFeature($user, 'stock_screens_per_month');
    }

    /**
     * Record a stock screen for a specific symbol, deduplicated per user per calendar month.
     */
    public static function recordStockScreen(User $user, string $symbol): void
    {
        $limit = $user->tier->features['stock_screens_per_month'] ?? 3;
        if ($limit === -1) {
            return;
        }

        $normalized = strtoupper(trim($symbol));
        if ($normalized === '') {
            return;
        }

        if (self::hasScreenedSymbolThisMonth($user, $normalized)) {
            return;
        }

        $symbolFeatureKey = 'stock_screen:' . $normalized;
        $symbolUsage = self::getOrResetMonthlyUsage($user, $symbolFeatureKey);
        $claimed = UserUsage::where('id', $symbolUsage->id)
            ->where('used_count', 0)
            ->update(['used_count' => 1]);

        if ($claimed > 0) {
            self::recordFeatureUsage($user, 'stock_screens_per_month');
        }
    }

    public static function stockScreenLimitPayload(User $user, string $periodStyle = 'this'): array
    {
        $limit = $user->tier->features['stock_screens_per_month'] ?? 3;
        $period = self::getUsagePeriod($user);
        $periodLabel = $periodStyle === 'adjective'
            ? ($period === 'quarter' ? 'quarterly' : 'monthly')
            : ($period === 'quarter' ? 'this quarter' : 'this month');

        $message = $periodStyle === 'adjective'
            ? "You have reached your {$periodLabel} limit of {$limit} stock screenings. Please upgrade your plan."
            : "You have reached your limit of {$limit} stock screenings {$periodLabel}. Please upgrade your plan.";

        $requiredTier = ($user->tier->slug ?? 'free') === 'free' ? 'pro' : 'max';
        self::sendThresholdUpgradeEmail($user, 'stock_screens_per_month', $requiredTier, $message);

        return [
            'error' => 'Upgrade Required',
            'upgrade_required' => true,
            'feature' => 'stock_screens_per_month',
            'limit' => $limit,
            'period' => $period,
            'required_tier' => $requiredTier,
            'message' => $message,
        ];
    }

    /**
     * Automatically email a user when they exhaust a tier quota or attempt a locked feature.
     * Deduplicated per user/feature per 24h so repeated taps do not spam their inbox.
     */
    public static function sendThresholdUpgradeEmail(
        User $user,
        string $featureKey = 'general',
        ?string $requiredTier = null,
        ?string $reason = null
    ): bool {
        if (empty($user->email)) {
            return false;
        }

        $currentSlug = $user->tier->slug ?? 'free';
        if ($currentSlug === 'max') {
            return false;
        }

        $normalizedFeature = preg_replace('/[^a-z0-9_:-]/i', '_', strtolower(trim($featureKey))) ?: 'general';
        $dedupKey = "threshold_upgrade_email:{$user->id}:{$normalizedFeature}:" . now()->toDateString();

        try {
            if (!Cache::add($dedupKey, true, now()->addHours(24))) {
                return false;
            }
        } catch (\Throwable) {
            // Proceed even if cache store fails temporarily
        }

        $targetTier = $requiredTier ?: ($currentSlug === 'free' ? 'pro' : 'max');
        $currentPlanName = $user->tier->name ?? ($currentSlug === 'pro' ? 'Rawdha' : 'Miftah');
        $targetPlanName = $targetTier === 'max' ? 'Noor (Max)' : 'Rawdha (Pro)';

        $featureLabels = [
            'stock_screens_per_month' => 'stock screenings',
            'portfolio_limit'         => 'portfolio holdings',
            'watchlist_limit'         => 'watchlist & price alerts',
            'baskets'                 => 'thematic & custom baskets',
            'purifications_per_month' => 'dividend purification runs',
            'zakat_calc'              => 'automated Zakat calculation',
            'statements'              => 'broker statements & history',
            'dividend_alerts'         => 'dividend alerts',
            'drift_tracking'          => '90-day compliance drift tracking',
            'monthly_spotlight'       => 'Monthly Spotlight insights',
        ];
        $featureLabel = $featureLabels[$normalizedFeature] ?? 'account features';

        $pricingUrl = rtrim((string) config('app.frontend_url', 'https://iirshad.com'), '/')
            . '/pricing?plan=' . urlencode($targetTier);

        $tierBenefits = $targetTier === 'max'
            ? 'unlimited stock screenings, unlimited holdings & watchlist alerts, full curated + unlimited custom baskets, unlimited purification, Dividend Alerts, 90-day Drift Tracking, and Monthly Spotlight.'
            : '30 quarterly stock screenings, 7 holdings, 2 watchlist alerts, 3 curated + 3 custom baskets, 6 quarterly purifications, Zakat calculation, and broker statements.';

        $reasonLine = $reason
            ? trim(preg_replace('/\s*Please upgrade.*$/i', '', $reason))
            : "You reached your {$currentPlanName} limit for {$featureLabel}.";

        $body = "Assalamu Alaikum {$user->name},\n\n"
            . "{$reasonLine}\n\n"
            . "To continue without limits, you can upgrade from {$currentPlanName} to {$targetPlanName} for {$tierBenefits}\n\n"
            . "View plans & upgrade anytime on our website:\n"
            . "{$pricingUrl}\n\n"
            . "Thank you,\nThe Irshad Team";

        try {
            Mail::raw($body, function ($message) use ($user, $targetPlanName) {
                $message->to($user->email)->subject("Unlock {$targetPlanName} on Irshad");
            });
            return true;
        } catch (\Throwable $e) {
            Log::warning("Failed sending threshold upgrade email to user #{$user->id}: {$e->getMessage()}");
            return false;
        }
    }

    public static function hasScreenedSymbolThisMonth(User $user, string $symbol): bool
    {
        $normalized = strtoupper(trim($symbol));
        if ($normalized === '') {
            return false;
        }

        $symbolFeatureKey = 'stock_screen:' . $normalized;
        $usage = UserUsage::where('user_id', $user->id)
            ->where('feature', $symbolFeatureKey)
            ->first();

        if (!$usage) {
            return false;
        }

        if ($usage->reset_at && Carbon::now()->greaterThanOrEqualTo($usage->reset_at)) {
            $usage->update([
                'used_count' => 0,
                'reset_at' => self::nextResetAt($user),
            ]);
            return false;
        }

        return $usage->used_count > 0;
    }

    public static function getFeatureUsageCount(User $user, string $featureKey): int
    {
        $usage = UserUsage::where('user_id', $user->id)
            ->where('feature', $featureKey)
            ->first();

        if (!$usage) {
            return 0;
        }

        if ($usage->reset_at && Carbon::now()->greaterThanOrEqualTo($usage->reset_at)) {
            $usage->update([
                'used_count' => 0,
                'reset_at' => self::nextResetAt($user),
            ]);
            return 0;
        }

        return (int) $usage->used_count;
    }

    public static function syncUsageTrackingForPlanChange(User $user, ?string $previousSlug = null): void
    {
        $user->unsetRelation('activeSubscription');
        $user->unsetRelation('tier');

        $newSlug = $user->tier->slug ?? 'free';
        $ranks = ['free' => 0, 'pro' => 1, 'max' => 2];
        $isUpgrade = ($ranks[$newSlug] ?? 0) > ($ranks[$previousSlug ?? 'free'] ?? 0);
        $nextResetAt = self::nextResetAt($user);

        $rows = UserUsage::where('user_id', $user->id)
            ->where(function ($q) {
                $q->whereIn('feature', ['stock_screens_per_month', 'purifications_per_month'])
                    ->orWhere('feature', 'like', 'stock_screen:%');
            })
            ->get();

        foreach ($rows as $row) {
            if ($isUpgrade) {
                $row->update([
                    'used_count' => 0,
                    'reset_at' => $nextResetAt,
                ]);
            } elseif ($previousSlug !== $newSlug) {
                // Keep usage count intact on downgrades to prevent quota bypass, but align cadence
                $row->update([
                    'reset_at' => $nextResetAt,
                ]);
            }
        }
    }

    public static function getUsagePeriod(User $user): string
    {
        return ($user->tier->slug ?? 'free') === 'pro' ? 'quarter' : 'month';
    }

    private static function nextResetAt(User $user): Carbon
    {
        return self::getUsagePeriod($user) === 'quarter'
            ? Carbon::now()->firstOfQuarter()->addQuarter()
            : Carbon::now()->startOfMonth()->addMonth();
    }

    public static function getUsageSummary(User $user): array
    {
        $features = $user->tier->features ?? [];
        $period = self::getUsagePeriod($user);

        $screensLimit = $features['stock_screens_per_month'] ?? 3;
        $screensUsed = self::getFeatureUsageCount($user, 'stock_screens_per_month');

        $purificationsLimit = $features['purifications_per_month'] ?? 0;
        $purificationsUsed = self::getFeatureUsageCount($user, 'purifications_per_month');

        $portfolioLimit = $features['portfolio_limit'] ?? 3;
        $portfolioUsed = Holding::where('user_id', $user->id)->count();

        $watchlistLimit = $features['watchlist_limit'] ?? 0;
        $watchlistUsed = Watchlist::where('user_id', $user->id)->count();

        $basketsLimit = $features['baskets'] ?? 0;
        $basketsUsed = Basket::where('user_id', $user->id)->count();

        return [
            'stock_screens_per_month' => [
                'used' => $screensUsed,
                'limit' => $screensLimit,
                'remaining' => $screensLimit === -1 ? -1 : max(0, $screensLimit - $screensUsed),
                'period' => $period,
            ],
            'purifications_per_month' => [
                'used' => $purificationsUsed,
                'limit' => $purificationsLimit,
                'remaining' => $purificationsLimit === -1 ? -1 : max(0, $purificationsLimit - $purificationsUsed),
                'period' => $period,
            ],
            'portfolio_limit' => [
                'used' => $portfolioUsed,
                'limit' => $portfolioLimit,
                'remaining' => $portfolioLimit === -1 ? -1 : max(0, $portfolioLimit - $portfolioUsed),
            ],
            'watchlist_limit' => [
                'used' => $watchlistUsed,
                'limit' => $watchlistLimit,
                'remaining' => $watchlistLimit === -1 ? -1 : max(0, $watchlistLimit - $watchlistUsed),
            ],
            'baskets' => [
                'used' => $basketsUsed,
                'limit' => $basketsLimit,
                'remaining' => $basketsLimit === -1 ? -1 : max(0, $basketsLimit - $basketsUsed),
            ],
        ];
    }

    private static function getOrResetMonthlyUsage(User $user, string $featureKey): UserUsage
    {
        try {
            $usage = UserUsage::firstOrCreate(
                ['user_id' => $user->id, 'feature' => $featureKey],
                ['used_count' => 0, 'reset_at' => self::nextResetAt($user)]
            );
        } catch (UniqueConstraintViolationException) {
            $usage = UserUsage::where('user_id', $user->id)
                ->where('feature', $featureKey)
                ->firstOrFail();
        }

        if ($usage->reset_at && Carbon::now()->greaterThanOrEqualTo($usage->reset_at)) {
            $usage->update([
                'used_count' => 0,
                'reset_at' => self::nextResetAt($user),
            ]);
        }

        return $usage;
    }
}
