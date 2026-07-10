<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BrokerageAccount extends Model
{
    protected $fillable = [
        'user_id',
        'broker_name',
        'account_id',
        'access_token',
        'status',
    ];

    protected $casts = [
        'access_token' => 'encrypted',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
