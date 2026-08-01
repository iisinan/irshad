<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dividend extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'ex_date' => 'date',
        'record_date' => 'date',
        'pay_date' => 'date',
        'amount' => 'decimal:4',
        'yield' => 'decimal:4',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
