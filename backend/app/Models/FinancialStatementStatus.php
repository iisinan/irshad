<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialStatementStatus extends Model
{
    protected $fillable = [
        'company_ticker',
        'financial_year',
        'status',
        'last_checked_at',
        'next_retry_at',
        'attempt_count',
        'failure_reason',
    ];

    protected $casts = [
        'last_checked_at' => 'datetime',
        'next_retry_at' => 'datetime',
    ];
}
