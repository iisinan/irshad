<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'billing_cycle',
        'gateway',
        'squad_token_id',
        'last_transaction_ref',
        'auto_renew',
        'notes',
        'status',
        'renews_at',
        'ends_at',
    ];

    protected $casts = [
        'auto_renew' => 'boolean',
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
