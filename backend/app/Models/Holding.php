<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Holding extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'symbol',
        'shares',
        'average_buy_price',
        'grace_period_ends_at',
        'grace_period_notified',
    ];

    protected $casts = [
        'grace_period_ends_at' => 'datetime',
        'grace_period_notified' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class, 'symbol', 'symbol');
    }
}
