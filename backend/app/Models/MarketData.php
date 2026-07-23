<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MarketData extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'ticker',
        'latest_price',
        'daily_change',
        'percentage_change',
        'market_capitalisation',
        'volume',
        'shares_outstanding',
        'fifty_two_week_high',
        'fifty_two_week_low',
        'last_trading_date',
        'last_trading_time',
        'data_source',
        'retrieval_timestamp',
    ];

    protected $casts = [
        'latest_price' => 'decimal:4',
        'daily_change' => 'decimal:4',
        'percentage_change' => 'float',
        'market_capitalisation' => 'decimal:2',
        'volume' => 'integer',
        'shares_outstanding' => 'integer',
        'fifty_two_week_high' => 'decimal:4',
        'fifty_two_week_low' => 'decimal:4',
        'last_trading_date' => 'date',
        'retrieval_timestamp' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
