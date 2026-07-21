<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Company extends Model
{
    use HasFactory;

    protected function logoUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => ($value && !str_starts_with($value, 'http')) 
                ? rtrim(config('app.url'), '/') . '/' . ltrim($value, '/')
                : $value,
        );
    }

    protected $fillable = [
        'name',
        'symbol',
        'is_sec_registered',
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
