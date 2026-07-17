<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PortfolioSnapshot extends Model
{
    protected $guarded = [];

    protected $casts = [
        'date' => 'date',
        'total_balance' => 'float',
        'cash_balance' => 'float',
        'stocks_balance' => 'float',
        'halal_value' => 'float',
        'health_percentage' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
