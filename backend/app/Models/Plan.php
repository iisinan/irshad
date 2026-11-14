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

    /**
     * Resolve the Naira price for a given billing cycle.
     */
    public function priceForCycle(string $cycle): float
    {
        return (float) match ($cycle) {
            'yearly'    => $this->price_yearly,
            'quarterly' => $this->price_quarterly ?: ($this->price_monthly * 3),
            default     => $this->price_monthly,
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

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
