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
        'paystack_plan_code_monthly',
        'paystack_plan_code_quarterly',
        'paystack_plan_code_yearly',
        'features',
    ];

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
