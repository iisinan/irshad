<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'price_monthly',
        'price_yearly',
        'paystack_plan_code_monthly',
        'paystack_plan_code_yearly',
        'features',
    ];

    protected $casts = [
        'price_monthly' => 'decimal:2',
        'price_yearly' => 'decimal:2',
        'features' => 'array',
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
