<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'price_monthly',
        'price_quarterly',
        'price_quarterly_regular',
        'price_yearly',
        'price_yearly_regular',
        'features',
    ];

    protected $hidden = [
        'price_monthly',
        'paystack_plan_code_monthly',
        'paystack_plan_code_yearly',
        'paystack_plan_code_quarterly',
    ];

    /**
     * Resolve the Naira price for a given billing cycle (quarterly or yearly only).
     */
    public function priceForCycle(string $cycle): float
    {
        return (float) match ($cycle) {
            'yearly'    => $this->price_yearly,
            'quarterly' => $this->price_quarterly,
            default     => $this->price_quarterly,
        };
    }

    protected $casts = [
        'price_monthly' => 'decimal:2',
        'price_quarterly' => 'decimal:2',
        'price_quarterly_regular' => 'decimal:2',
        'price_yearly' => 'decimal:2',
        'price_yearly_regular' => 'decimal:2',
        'features' => 'array',
    ];

    /**
     * Canonical feature matrix for each subscription tier slug.
     */
    public static function defaultFeaturesForSlug(?string $slug): array
    {
        return match ($slug) {
            'max' => [
                'stock_screens_per_month' => -1,
                'portfolio_limit' => -1,
                'watchlist_limit' => -1,
                'baskets' => -1,
                'statements' => true,
                'purifications_per_month' => -1,
                'zakat_calc' => true,
                'dividend_alerts' => true,
                'drift_tracking' => true,
                'monthly_spotlight' => true,
            ],
            'pro' => [
                'stock_screens_per_month' => 10,
                'portfolio_limit' => 7,
                'watchlist_limit' => 2,
                'baskets' => 3,
                'statements' => true,
                'purifications_per_month' => 2,
                'zakat_calc' => true,
                'dividend_alerts' => false,
                'drift_tracking' => false,
                'monthly_spotlight' => false,
            ],
            default => [
                'stock_screens_per_month' => 3,
                'portfolio_limit' => 3,
                'watchlist_limit' => 0,
                'baskets' => 0,
                'statements' => false,
                'purifications_per_month' => 0,
                'zakat_calc' => false,
                'dividend_alerts' => false,
                'drift_tracking' => false,
                'monthly_spotlight' => false,
            ],
        };
    }

    /**
     * Always merge canonical defaults with any stored JSON features so missing keys never break tier checks.
     */
    public function getFeaturesAttribute($value): array
    {
        $defaults = self::defaultFeaturesForSlug($this->attributes['slug'] ?? null);
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            $stored = is_array($decoded) ? $decoded : [];
        } elseif (is_array($value)) {
            $stored = $value;
        } else {
            $stored = [];
        }

        return array_merge($defaults, $stored);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
