<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'billing_cycle',
        'paystack_subscription_code',
        'paystack_email_token',
        'status',
        'renews_at',
        'ends_at',
    ];

    protected $casts = [
        'renews_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }
}
