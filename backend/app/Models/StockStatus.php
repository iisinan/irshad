<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockStatus extends Model
{
    use HasFactory;

    protected $table = 'stock_statuses';

    protected $fillable = [
        'company_id',
        'status',
        'reason',
        'verified_by_scholar',
        'last_updated',
    ];

    protected $casts = [
        'verified_by_scholar' => 'boolean',
        'last_updated' => 'datetime',
    ];
}
