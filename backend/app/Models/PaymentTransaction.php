<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'billing_cycle',
        'gateway',
        'transaction_ref',
        'gateway_ref',
        'amount_kobo',
        'currency',
        'status',
        'type',
        'paid_at',
        'raw_payload',
    ];

    protected $casts = [
        'amount_kobo' => 'integer',
        'paid_at' => 'datetime',
        'raw_payload' => 'array',
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
