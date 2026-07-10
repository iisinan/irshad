<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyPrice extends Model
{
    protected $fillable = [
        'company_id',
        'price',
        'volume',
        'date',
    ];

    protected $casts = [
        'date' => 'date',
        'price' => 'decimal:2',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
