<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'symbol',
        'logo_url',
        'sector',
        'industry',
        'business_type',
        'description',
        'overview',
        'analysts_target',
        'valuation_info',
        'growth_info',
        'div_yield',
    ];

    public function financials(): HasMany
    {
        return $this->hasMany(Financial::class);
    }

    public function status(): HasOne
    {
        return $this->hasOne(StockStatus::class);
    }

    public function dataSources(): HasMany
    {
        return $this->hasMany(DataSource::class);
    }

    public function dailyPrices(): HasMany
    {
        return $this->hasMany(DailyPrice::class);
    }
}
