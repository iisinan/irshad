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
        'sector',
        'business_type',
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
}
