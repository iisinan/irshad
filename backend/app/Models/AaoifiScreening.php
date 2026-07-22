<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AaoifiScreening extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'business_status',
        'business_reasoning',
        'debt_ratio',
        'debt_status',
        'cash_ratio',
        'cash_status',
        'impermissible_income_ratio',
        'impermissible_income_status',
        'final_status',
        'news_sources',
        'financial_data_used',
        'illiquid_ratio',
        'illiquid_status',
    ];

    protected $casts = [
        'business_reasoning' => 'array',
        'debt_ratio' => 'decimal:4',
        'cash_ratio' => 'decimal:4',
        'impermissible_income_ratio' => 'decimal:4',
        'illiquid_ratio' => 'decimal:4',
        'news_sources' => 'array',
        'financial_data_used' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
