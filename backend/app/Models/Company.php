<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Company extends Model
{
    use HasFactory;

    protected function logoUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => ($value && ! str_starts_with($value, 'http'))
                ? rtrim(config('app.url'), '/').'/'.ltrim($value, '/')
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
        'current_status',
        'market_cap',
        'eps',
        'pe_ratio',
        'activity_reason',
        'latest_price',
        'price_change_pct',
        'email',
        'date_listed',
        'date_of_incorporation',
    ];

    public function financials(): HasMany
    {
        return $this->hasMany(Financial::class);
    }

    public function latestFinancial(): HasOne
    {
        return $this->hasOne(Financial::class)->latestOfMany();
    }

    public function dividends(): HasMany
    {
        return $this->hasMany(Dividend::class);
    }

    public function latestDividend(): HasOne
    {
        return $this->hasOne(Dividend::class)->latestOfMany('pay_date');
    }

    public function status(): HasOne
    {
        return $this->hasOne(StockStatus::class);
    }

    public function dataSources(): HasMany
    {
        return $this->hasMany(DataSource::class);
    }

    public function aaoifiScreening(): HasOne
    {
        return $this->hasOne(AaoifiScreening::class);
    }

    public function dailyPrices(): HasMany
    {
        return $this->hasMany(DailyPrice::class);
    }

    public function news(): HasMany
    {
        return $this->hasMany(News::class)->orderBy('published_at', 'desc');
    }
}
